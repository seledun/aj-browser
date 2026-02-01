#
#   Author:
#   a: Sebastian Ledung - seledun@github
#   c: 2025-02-28
#   u: 2026-02-01
#

from datetime import datetime, timezone

from helpers import get_request_bodies
from helpers import jsonutils
from helpers import dbutils

import requests
import sqlite3
import logging
import shutil
import json
import os

HOST                = "https://api.banned.video/graphql"
CHANNEL_ID          = "5b885d33e6646a0015a6fa2d"
REPLY_ERROR_PATH    = "errors/reply-errors"
COMMENT_ERROR_PATH  = "errors/comment-errors"
DB_PATH             = "../prisma/store.db"
LOG_DIR             = "logs"
LIMIT               = 250

os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(COMMENT_ERROR_PATH, exist_ok=True)
os.makedirs(REPLY_ERROR_PATH, exist_ok=True)

# Set up logging
log_file = f"{LOG_DIR}/{datetime.now().strftime('%y-%m-%d-%H-%M')}.txt"
logging.basicConfig(filename=log_file, level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Copy the database to not update it in place
shutil.copyfile(DB_PATH, "temp.db")
logger.info("Copied store.db to temp.db")

# Create database connection and cursor
start_time = datetime.now(timezone.utc)
con = sqlite3.connect("temp.db")
cur = con.cursor()
dbutils.initializeTables(cur)

### Fetch all videos
logger.info(f"Fetching videos from {HOST}")
offset = 0
while True:
    body = get_request_bodies.getVideoRequestBody(CHANNEL_ID, LIMIT, offset)
    try:
        resp = requests.post(HOST, json=body)
        obj = json.loads(resp.text)
        videos = obj.get('data', {}).get('getChannel', {}).get('videos', [])
    
    except (requests.RequestException, json.JSONDecodeError, TypeError) as e:
        logger.error("Failed to fetch videos at offset " + str(offset))

    if videos:
        logger.info(f"Fetched {len(videos)} videos at offset {offset}")
        for video in videos:
            dbutils.addVideo(con, cur, video['_id'], video['title'], video['summary'], video['playCount'],
                        video['likeCount'], video['angerCount'], video['videoDuration'], video['createdAt'], None)
    else:
        logger.info(f"No more videos at offset {offset}")
        break

    offset += LIMIT

### Fetch all comments
logger.info("Fetching comments")
cur.execute("SELECT id FROM videos")
id_list = [row[0] for row in cur.fetchall()]

for idx, video_id in enumerate(id_list):
    retries, comment_count, offset = 0, 0, 0
    
    while True:
        body = get_request_bodies.getCommentRequestBody(video_id, LIMIT, offset)
        {
            "operationName": "GetVideoComments",
            "variables": {"id": video_id, "limit": LIMIT, "offset": offset},
            "query": "query GetVideoComments($id: String!, $limit: Float, $offset: Float) { getVideoComments(id: $id, limit: $limit, offset: $offset) { ...VideoComment replyCount __typename } } fragment VideoComment on Comment { _id content liked user { _id username __typename } voteCount { positive __typename } linkedUser { _id username __typename } createdAt __typename }"
        }

        try:
            resp = requests.post(HOST, json=body)
            obj = resp.json()
            
            if resp.status_code != 200:
                logger.error(f"Failed to fetch comments for video {video_id}: {resp.status_code}")
                break
    
            obj = resp.json()
    
            if not isinstance(obj, dict) or 'data' not in obj or 'getVideoComments' not in obj.get('data', {}):
                logger.error(f"Unexpected response structure for video {video_id}. Response content: {obj}")
                break
    
            comments = obj.get('data', {}).get('getVideoComments', [])
            
            if comments:
                logger.info(f"Fetched {len(comments)} comments for video {video_id} at offset {offset}")
                for comment in comments:
                    dbutils.addComment(
                        con, cur, video_id, comment['_id'], comment['content'],
                        comment['user']['_id'], comment['user']['username'],
                        comment['user']['__typename'], comment['voteCount']['positive'],
                        comment.get('linkedUser'), comment['createdAt'], comment['replyCount']
                    )
                    comment_count += 1
            else:
                dbutils.addCommentCount(con, cur, comment_count, video_id)
                break

        except (requests.RequestException, json.JSONDecodeError, TypeError) as e:
            if retries < 2:
                retries += 1
                logger.warning(f"Retry {retries}/3 for video {video_id} due to {e}")
                continue
            else:
                with open(f'{COMMENT_ERROR_PATH}/{video_id}', 'w') as file:
                    json.dump(body, file)
                logger.error(f"Failed to fetch comments for video {video_id} after 3 retries")
                break

        offset += LIMIT

### Trying to resolve comment errors
logger.info(f"Trying to resolve comment-errors")
ids_to_fetch = os.listdir(COMMENT_ERROR_PATH)
for video_id in ids_to_fetch:
    offset = 0
    comment_count = 0    
    logger.info(f"Brute-forcing comments for {video_id}")

    while (True):
        body = get_request_bodies.getCommentRequestBody(video_id, 1, offset) 
        try:
            resp = requests.post(HOST, json=body)
            obj = json.loads(resp.text)

            if (jsonutils.json_response_is_error(obj)):
                logger.info(f"[{video_id}] found erroneous comment @ {offset}")
                offset += 1
                continue

            if (jsonutils.json_response_is_finished(obj)):
                logger.info(f"[{video_id}] no more comments to index")
                break

            if (jsonutils.json_response_is_ok(obj)):
                comments = obj.get('data', {}).get('getVideoComments', [])
            
                if comments:
                    for comment in comments:
                        dbutils.addComment(
                            con, cur, video_id, comment['_id'], comment['content'],
                            comment['user']['_id'], comment['user']['username'],
                            comment['user']['__typename'], comment['voteCount']['positive'],
                            comment.get('linkedUser'), comment['createdAt'], comment['replyCount']
                        )
                        logger.info(f"[{video_id}] added comment @ {offset}")
                        comment_count += 1
            
            offset += 1

        except (requests.RequestException, json.JSONDecodeError, TypeError) as e:
            pass

    logger.info("Done with ", video_id, " fetched ", comment_count, "comments")
    dbutils.addCommentCount(con, cur, comment_count, video_id)
    os.remove('comment-errors/' + video_id)

logger.info("Fetching comment replies")
comments = dbutils.getAllComments(cur) 

for idx, (comment_id, video_id, reply_count) in enumerate(comments):
    retries, reply_count_fetched, offset = 0, 0, 0
    logger.info(f"[{video_id}] Fetching replies for comment {comment_id} ({reply_count} expected)")

    while True:
        body = get_request_bodies.getRepliesRequestBody(comment_id, LIMIT, offset)

        try:
            resp = requests.post(HOST, json=body)
            obj = resp.json()

            if resp.status_code != 200 or obj is None:
                logger.error(f"Failed to fetch replies for comment {comment_id}: {resp.status_code}")
                break

            replies = obj.get('data', {}).get('getCommentReplies', [])

            if replies:
                logger.info(f"Fetched {len(replies)} replies for comment {comment_id} at offset {offset}")
                for reply in replies:
                    linked_user = (
                        json.dumps(reply['linkedUser'])
                        if reply.get('linkedUser')
                        else None
                    )
                    
                    dbutils.addReply(
                        con, cur, reply['_id'], reply['content'],
                        reply['liked'], reply['user']['_id'],
                        reply['user']['username'], reply['voteCount']['positive'],
                        linked_user, reply['createdAt'], reply['replyTo']['_id']
                    )
                    reply_count_fetched += 1
            else:
                # No more replies
                break

        except (requests.RequestException, json.JSONDecodeError, TypeError) as e:
            if retries < 2:
                retries += 1
                logger.warning(f"Retry {retries}/3 for comment {comment_id} due to {e}")
                continue
            else:
                with open(f'{REPLY_ERROR_PATH}/{comment_id}', 'w') as file:
                    json.dump(body, file)
                logger.error(f"Failed to fetch replies for comment {comment_id} after 3 retries")
                break

        offset += LIMIT

    # Update fetched reply count in DB
    dbutils.addCommentCount(con, cur, reply_count_fetched, comment_id)

### Trying to resolve reply errors (brute-force, limit=1)
logger.info("Resolving reply errors")
ids_to_fetch = os.listdir(REPLY_ERROR_PATH)
for comment_id in ids_to_fetch:
    offset = 0
    reply_count_fetched = 0
    logger.info(f"Brute-forcing replies for comment {comment_id}")

    while True:
        body = get_request_bodies.getRepliesRequestBody(comment_id, 1, offset)  # limit = 1
        try:
            resp = requests.post(HOST, json=body)
            obj = resp.json()

            if jsonutils.json_response_is_error(obj):
                logger.info(f"[{comment_id}] found erroneous reply @ {offset}")
                offset += 1
                continue

            if jsonutils.json_response_is_finished(obj):
                logger.info(f"[{comment_id}] no more replies to index")
                break

            if jsonutils.json_response_is_ok(obj):
                replies = obj.get('data', {}).get('getCommentReplies', [])
                if replies:
                    for reply in replies:
                        linked_user = (
                            json.dumps(reply['linkedUser'])
                            if reply.get('linkedUser')
                            else None
                        )
                        
                        dbutils.addReply(
                            con, cur, reply['_id'], reply['content'],
                            reply['liked'], reply['user']['_id'],
                            reply['user']['username'], reply['voteCount']['positive'],
                            linked_user, reply['createdAt'], reply['replyTo']['_id']
                        )
                        logger.info(f"[{comment_id}] added reply @ {offset}")
                        reply_count_fetched += 1

            offset += 1

        except (requests.RequestException, json.JSONDecodeError, TypeError):
            pass

    logger.info(f"Done with comment {comment_id}, fetched {reply_count_fetched} replies")
    dbutils.addCommentCount(con, cur, reply_count_fetched, comment_id)
    os.remove(f'{REPLY_ERROR_PATH}/{comment_id}')

### Clean-up and timestamp database 
dbutils.addTimeStamp(con, cur)
con.close()

shutil.move("temp.db", DB_PATH)
logger.info("Replaced store.db with updated temp.db")

### Print run-time information
end_time = datetime.now(timezone.utc)
duration = end_time - start_time
hours, remainder = divmod(duration.seconds, 3600)
minutes = remainder // 60

logger.info(f"Archiving finished in {hours}h {minutes}min")
logger.info(f"Comment errors left: {len(os.listdir(COMMENT_ERROR_PATH))}")
