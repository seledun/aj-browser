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
LIMIT               = 500
EXP_BACKOFF_LIMIT   = 50 # Used as initial limit for the exp. backoff

# LOG_LEVEL = logging.INFO
LOG_LEVEL = logging.WARNING

os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(COMMENT_ERROR_PATH, exist_ok=True)
os.makedirs(REPLY_ERROR_PATH, exist_ok=True)

# Set up logging
log_file = f"{LOG_DIR}/{datetime.now().strftime('%y-%m-%d-%H-%M')}.txt"
logging.basicConfig(filename=log_file, level=LOG_LEVEL, format='%(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Copy the database to not update it in place
shutil.copyfile(DB_PATH, "temp.db")
logger.info("Copied database: store.db → temp.db")

# Create database connection and cursor
logger.info(f"Connecting to database and initializing tables")
start_time = datetime.now(timezone.utc)
con = sqlite3.connect("temp.db")
cur = con.cursor()
dbutils.initializeTables(cur)

# Stat counters
new_videos      = 0
new_comments    = 0
new_replies     = 0

## Fetch all videos
logger.info(f"Fetching videos from {HOST}")
total_videos = 0
offset = 0
while True:
    body = get_request_bodies.getVideoRequestBody(CHANNEL_ID, LIMIT, offset)
    try:
        resp = requests.post(HOST, json=body)
        obj = json.loads(resp.text)
        videos = obj.get('data', {}).get('getChannel', {}).get('videos', [])
    
    except (requests.RequestException, json.JSONDecodeError, TypeError) as e:
        logger.error(f"Video fetch failed @ offset {offset}")

    if videos:
        logger.info(f"Fetched {len(videos)} videos @ offset {offset}")
        for video in videos:
            new_videos += dbutils.addVideo(con, cur, video['_id'], video['title'], video['summary'], video['playCount'],
                        video['likeCount'], video['angerCount'], video['videoDuration'], video['createdAt'], None)

        # Don't need to query the next page if this is not full
        if len(videos) < LIMIT:
            break

    else:
        logger.info(f"No more videos at offset {offset}")
        break

    offset += LIMIT

## Fetch all comments
logger.info("Fetching all video comments")
cur.execute("SELECT id FROM videos")
id_list = [row[0] for row in cur.fetchall()]
counter = 0

for idx, video_id in enumerate(id_list):
    retries, comment_count, offset = 0, 0, 0
    logger.info(f"[{video_id}] fetching comments ({counter}/{total_videos})")
    counter += 1
    
    while True:
        body = get_request_bodies.getCommentRequestBody(video_id, LIMIT, offset)
        try:
            resp = requests.post(HOST, json=body)
            obj = resp.json()
            
            if resp.status_code != 200:
                logger.error(f"[{video_id}] failed to fetch comments: {resp.status_code}")
                break
    
            obj = resp.json()
    
            if not isinstance(obj, dict) or 'data' not in obj or 'getVideoComments' not in obj.get('data', {}):
                logger.error(f"[{video_id}] invalid comment response")
                break
    
            comments = obj.get('data', {}).get('getVideoComments', [])
            
            if comments:
                logger.info(f"[{video_id}] fetched {len(comments)} comments @ offset {offset}")
                for comment in comments:
                    new_comments += dbutils.addComment(
                        con, cur, video_id, comment['_id'], comment['content'],
                        comment['user']['_id'], comment['user']['username'],
                        comment['user']['__typename'], comment['voteCount']['positive'],
                        comment.get('linkedUser'), comment['createdAt'], comment['replyCount']
                    )
                    comment_count += 1
                
                # Don't need to query the next page if this is not full
                if len(comments) < LIMIT:
                    break
                
            else:
                dbutils.addCommentCount(con, cur, comment_count, video_id)
                break

        except (requests.RequestException, json.JSONDecodeError, TypeError) as e:
            if retries < 2:
                retries += 1
                logger.warning(f"[{video_id}] retry {retries}/3 due to {e}")
                continue
            else:
                with open(f'{COMMENT_ERROR_PATH}/{video_id}', 'w') as file:
                    json.dump(body, file)
                logger.error(f"[{video_id}] failed fetching comments after 3 retries")
                break
        offset += LIMIT

### Trying to resolve comment errors
logger.info("Resolving comment errors")
ids_to_fetch = os.listdir(COMMENT_ERROR_PATH)

for counter, video_id in enumerate(ids_to_fetch):
    offset = 0
    comment_count = 0
        
    logger.info(f"[{video_id}] retrying comments ({counter}/{len(ids_to_fetch)})")
    current_limit = EXP_BACKOFF_LIMIT
    
    while (True):
        body = get_request_bodies.getCommentRequestBody(video_id, current_limit, offset) 
        try:
            resp = requests.post(HOST, json=body)
            obj = json.loads(resp.text)

            if (jsonutils.json_response_is_error(obj)):
                logger.warning(f"[{video_id}] bad comment @ offset {offset} with limit {current_limit}")
                
                if (current_limit == 1):
                    logger.warning(f"[{video_id}] skipping bad comment @ offset {offset}")
                    offset += 1
                    current_limit = EXP_BACKOFF_LIMIT
                    continue
                    
                current_limit = max(1, current_limit // 2)
                continue

            if (jsonutils.json_response_is_finished(obj, "getVideoComments")):
                logger.info(f"[{video_id}] no more comments to index")
                break

            if (jsonutils.json_response_is_ok(obj)):
                comments = obj.get('data', {}).get('getVideoComments', [])
            
                if comments:
                    for comment in comments:
                        new_comments += dbutils.addComment(
                            con, cur, video_id, comment['_id'], comment['content'],
                            comment['user']['_id'], comment['user']['username'],
                            comment['user']['__typename'], comment['voteCount']['positive'],
                            comment.get('linkedUser'), comment['createdAt'], comment['replyCount']
                        )
                        logger.info(f"[{video_id}] added comment @ {offset}")
                        comment_count += 1
                
                    offset += len(comments)
                    current_limit = EXP_BACKOFF_LIMIT
                
                else:
                    break

        except Exception as e:
            logger.exception(f"[{video_id}] fatal error @ offset {offset}")
            break
    
    logger.info(f"[{video_id}] Done — {comment_count} recovered comments")
    dbutils.addCommentCount(con, cur, comment_count, video_id)
    os.remove(f"{COMMENT_ERROR_PATH}/{video_id}")

logger.info("Fetching comment replies")
comments = dbutils.getAllComments(cur) 
counter = 0

for idx, (comment_id, video_id, reply_count) in enumerate(comments):
    retries, reply_count_fetched, offset = 0, 0, 0
    logger.info(f"[{comment_id}] fetching replies ({counter}/{len(comments)})")
    while True:
        body = get_request_bodies.getRepliesRequestBody(comment_id, LIMIT, offset)

        try:
            resp = requests.post(HOST, json=body)
            obj = resp.json()

            if (jsonutils.json_response_is_error(obj)):
                logger.warning(f"[{comment_id}] bad response @ offset {offset}")
                raise json.JSONDecodeError

            if (jsonutils.json_response_is_finished(obj, "getCommentReplies")):
                logger.info(f"[{comment_id}] no replies @ offset {offset}")
                break

            if (jsonutils.json_response_is_ok(obj)):
                replies = obj.get('data', {}).get('getCommentReplies', [])
                if replies:
                    logger.info(f"[{comment_id}] {len(replies)} replies @ offset {offset}")
                    for reply in replies:
                        linked_user = (
                            json.dumps(reply['linkedUser'])
                            if reply.get('linkedUser')
                            else None
                        )
                        
                        new_replies += dbutils.addReply(
                            con, cur, reply['_id'], reply['content'],
                            reply['liked'], reply['user']['_id'],
                            reply['user']['username'], reply['voteCount']['positive'],
                            linked_user, reply['createdAt'], reply['replyTo']['_id']
                        )
                        reply_count_fetched += 1
                    
                    # Don't need to query the next page if this is not full
                    if len(replies) < LIMIT: 
                        break
                    
            else:
                # No more replies
                break

        except (requests.RequestException, json.JSONDecodeError, TypeError) as e:
            if retries < 2:
                retries += 1
                logger.warning(f"[{comment_id}] retry {retries}/3 due to {e}")
                continue
            else:
                with open(f'{REPLY_ERROR_PATH}/{comment_id}', 'w') as file:
                    json.dump(body, file)
                logger.error(f"[{comment_id}] failed to fetch replies after 3 retries")
                break

        counter += 1
        offset += LIMIT

### Trying to resolve reply errors (exponential back-off)
logger.info("Resolving reply errors")
ids_to_fetch = os.listdir(REPLY_ERROR_PATH)

for counter, comment_id in enumerate(ids_to_fetch):
    offset = 0
    reply_count_fetched = 0
    current_limit = EXP_BACKOFF_LIMIT

    logger.info(f"[{comment_id}] retrying replies ({counter}/{len(ids_to_fetch)})")

    while True:
        body = get_request_bodies.getRepliesRequestBody(
            comment_id, current_limit, offset
        )

        try:
            resp = requests.post(HOST, json=body)
            obj = resp.json()

            if jsonutils.json_response_is_error(obj):
                logger.warning(
                    f"[{comment_id}] bad reply @ offset {offset} with limit {current_limit}"
                )

                if current_limit == 1:
                    logger.warning(
                        f"[{comment_id}] skipping poisoned reply @ offset {offset}"
                    )
                    offset += 1
                    current_limit = EXP_BACKOFF_LIMIT
                else:
                    current_limit = max(1, current_limit // 2)

                continue

            if jsonutils.json_response_is_finished(obj, "getCommentReplies"):
                logger.info(f"[{comment_id}] no more replies to index")
                break

            if jsonutils.json_response_is_ok(obj):
                replies = obj.get('data', {}).get('getCommentReplies', [])

                if not replies:
                    break

                for reply in replies:
                    linked_user = (
                        json.dumps(reply['linkedUser'])
                        if reply.get('linkedUser')
                        else None
                    )

                    new_replies += dbutils.addReply(
                        con, cur, reply['_id'], reply['content'],
                        reply['liked'], reply['user']['_id'],
                        reply['user']['username'],
                        reply['voteCount']['positive'],
                        linked_user, reply['createdAt'],
                        reply['replyTo']['_id']
                    )

                    logger.info(f"[{comment_id}] added reply @ {offset}")
                    reply_count_fetched += 1

                offset += len(replies)
                current_limit = EXP_BACKOFF_LIMIT

        except Exception:
            logger.exception(f"[{comment_id}] fatal error @ offset {offset}")
            break

    logger.info(f"[{comment_id}] done, got {reply_count_fetched} replies")
    os.remove(f"{REPLY_ERROR_PATH}/{comment_id}")

### Clean-up and timestamp database 
dbutils.addTimeStamp(con, cur)
con.close()
logger.info("Added timestamp and closed database")

shutil.move("temp.db", DB_PATH)
logger.info("Database updated successfully (temp.db → store.db)")

### Print run-time information
end_time = datetime.now(timezone.utc)
duration = end_time - start_time
hours, remainder = divmod(duration.seconds, 3600)
minutes = remainder // 60

# stats to both log and stdout
def stdoutAndLog(msg):
  logger.info(msg)
  print(msg)  

summary = f"""**Archive Summary**
- Finished in: {hours}h {minutes}m
- New videos: {new_videos}
- New comments: {new_comments}
- New replies: {new_replies}
- Comments DLQ size: {len(os.listdir(COMMENT_ERROR_PATH))}
- Reply DLQ size: {len(os.listdir(REPLY_ERROR_PATH))}
"""

stdoutAndLog(summary)