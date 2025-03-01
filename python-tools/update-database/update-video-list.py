#
#   Author:
#   a: Sebastian Ledung - seledun@github
#   c: 2025-02-28
#

from datetime import datetime, timezone
import jsonutils
import requests
import sqlite3
import logging
import dbutils
import shutil
import json
import os

HOST        = "https://api.banned.video/graphql"
CHANNEL_ID  = "5b885d33e6646a0015a6fa2d"
ERROR_PATH  = "comment-errors"
LOG_DIR     = "logs"
LIMIT       = 250

os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(ERROR_PATH, exist_ok=True)

# Set up logging
log_file = f"{LOG_DIR}/{datetime.now().strftime('%y-%m-%d-%H-%M')}.txt"
logging.basicConfig(filename=log_file, level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Copy the database to not update it in place
shutil.copyfile("../../prisma/store.db", "temp.db")
logger.info("Copied store.db to temp.db")

# Create database connection and cursor
start_time = datetime.now(timezone.utc)
con = sqlite3.connect("temp.db")
cur = con.cursor()
dbutils.initializeTables(con, cur)

### Fetch all videos
logger.info(f"Fetching videos from {HOST}")
offset = 0
while True:
    body = {
        "operationName": "GetChannelVideos",
        "variables": {"id": CHANNEL_ID, "limit": LIMIT, "offset": offset},
        "query": "query GetChannelVideos($id: String!, $limit: Float, $offset: Float) { getChannel(id: $id) { _id videos(limit: $limit, offset: $offset) { ...DisplayVideoFields __typename } __typename } } fragment DisplayVideoFields on Video { _id title summary playCount likeCount angerCount largeImage embedUrl published videoDuration channel { _id title avatar __typename } createdAt __typename }"
    }
   
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
        body = {
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
                with open(f'{ERROR_PATH}/{video_id}', 'w') as file:
                    json.dump(body, file)
                logger.error(f"Failed to fetch comments for video {video_id} after 3 retries")
                break

        offset += LIMIT

### Trying to resolve comment errors
logger.info(f"Trying to resolve comment-errors")
ids_to_fetch = os.listdir('comment-errors')
for video_id in ids_to_fetch:
    offset = 0
    comment_count = 0    
    logger.info(f"Brute-forcing comments for {video_id}")

    while (True):
        body = {
            "operationName": "GetVideoComments",
            "variables": {"id": video_id, "limit": 1, "offset": offset},
            "query": "query GetVideoComments($id: String!, $limit: Float, $offset: Float) { getVideoComments(id: $id, limit: $limit, offset: $offset) { ...VideoComment replyCount __typename } } fragment VideoComment on Comment { _id content liked user { _id username __typename } voteCount { positive __typename } linkedUser { _id username __typename } createdAt __typename }"
        }

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

    print("Done with ", video_id, " fetched ", comment_count, "comments")
    dbutils.addCommentCount(con, cur, comment_count, video_id)
    os.remove('comment-errors/' + video_id)

### Clean-up and timestamp database 
dbutils.addTimeStamp(con, cur)
con.close()

shutil.move("temp.db", "../../prisma/store.db")
logger.info("Replaced store.db with updated temp.db")

### Print run-time information
end_time = datetime.now(timezone.utc)
duration = end_time - start_time
hours, remainder = divmod(duration.seconds, 3600)
minutes = remainder // 60

logger.info(f"Archiving finished in {hours}h {minutes}min")
logger.info(f"Comment errors left: {len(os.listdir(ERROR_PATH))}")