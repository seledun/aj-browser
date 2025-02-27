from datetime import datetime, timezone
import requests
import sqlite3
import json
import os
import logging
import shutil

# Define constants
host = "https://api.banned.video/graphql"
channel_id = "5b885d33e6646a0015a6fa2d"
error_path = "comment-errors"
limit = 250  # site default
offset = 0

# Set up logging
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)
log_file = f"{log_dir}/{datetime.now().strftime('%y-%m-%d-%H-%M')}.txt"
logging.basicConfig(filename=log_file, level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Create a copy before work
shutil.copyfile("store.db", "temp.db")
logger.info("Copied store.db to temp.db")

# Create database connection and cursor
start_time = datetime.now(timezone.utc)
con = sqlite3.connect("temp.db")
cur = con.cursor()

# Create error directory if it doesn't exist
os.makedirs(error_path, exist_ok=True)

def createTableIfNotExists(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS comments (
            id TEXT NOT NULL UNIQUE, videoId TEXT, content TEXT, userId TEXT,
            username TEXT, userType TEXT, posVotes INTEGER, linkedUser TEXT,
            createdAt TEXT, replyCount INTEGER
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS videos (
            id TEXT NOT NULL UNIQUE, title TEXT, summary TEXT, playCount INTEGER,
            likeCount INTEGER, angerCount INTEGER, duration REAL, createdAt TEXT,
            commentCount INTEGER DEFAULT 0
        )
    """)
    cur.execute("CREATE TABLE IF NOT EXISTS updated (id INTEGER PRIMARY KEY AUTOINCREMENT, updated TEXT)")

def insertVideo(cur, id, title, summary, playCount, likeCount, angerCount, duration, createdAt, commentCount):
    try:
        cur.execute("""
            INSERT INTO videos (id, title, summary, playCount, likeCount, angerCount,
            duration, createdAt, commentCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (id, title, summary, playCount, likeCount, angerCount, duration, createdAt, commentCount))
        con.commit()
        logger.info(f"Added video {id}")
    except sqlite3.IntegrityError:
        cur.execute("""
            UPDATE videos
            SET playCount = ?, likeCount = ?, angerCount = ?
            WHERE id = ?
        """, (playCount, likeCount, angerCount, id))
        con.commit()
        logger.debug(f"Video {id} already exists in the database, updating values.")

def insertComment(cur, videoId, id, content, userId, username, userType, posVotes, linkedUser, createdAt, replyCount):
    try:
        cur.execute("""
            INSERT INTO comments (id, videoId, content, userId, username, userType,
            posVotes, linkedUser, createdAt, replyCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (id, videoId, content, userId, username, userType, posVotes, linkedUser, createdAt, replyCount))
        con.commit()
        logger.info(f"Added comment {id}")
    except sqlite3.IntegrityError:
        cur.execute("""
            UPDATE comments
            SET posVotes = ?, replyCount = ?
            WHERE id = ?
        """, (posVotes, replyCount, id))
        logger.debug(f"Comment {id} already exists in the database, updating values.")

def updateCommentCount(count, video_id):
    if count > 0:  # Default value = 0 in database
        cur.execute("UPDATE videos SET commentCount = ? WHERE id = ?", (count, video_id))
        con.commit()
        logger.info(f"Updated video {video_id} with comment count {count}")

def addTimeStamp(cur):
    timestamp = datetime.now(timezone.utc).isoformat(timespec='milliseconds')
    cur.execute("INSERT INTO updated (updated) VALUES (?)", (timestamp,));
    con.commit()
    logger.info(f"Dump finished at {timestamp}")

# Create tables if they do not exist
createTableIfNotExists(cur)

### Fetch all videos
logger.info(f"Fetching videos from {host}")
while True:
    body = {
        "operationName": "GetChannelVideos",
        "variables": {"id": channel_id, "limit": limit, "offset": offset},
        "query": "query GetChannelVideos($id: String!, $limit: Float, $offset: Float) { getChannel(id: $id) { _id videos(limit: $limit, offset: $offset) { ...DisplayVideoFields __typename } __typename } } fragment DisplayVideoFields on Video { _id title summary playCount likeCount angerCount largeImage embedUrl published videoDuration channel { _id title avatar __typename } createdAt __typename }"
    }
   
    try:
        resp = requests.post(host, json=body)
        obj = json.loads(resp.text)
        videos = obj.get('data', {}).get('getChannel', {}).get('videos', [])
    
    except (requests.RequestException, json.JSONDecodeError, TypeError) as e:
        logger.error("Failed to fetch videos at offset " + str(offset));

    if videos:
        logger.info(f"Fetched {len(videos)} videos at offset {offset}")
        for video in videos:
            insertVideo(cur, video['_id'], video['title'], video['summary'], video['playCount'],
                        video['likeCount'], video['angerCount'], video['videoDuration'], video['createdAt'], None)
    else:
        logger.info(f"No more videos at offset {offset}")
        break

    offset += limit

### Fetch all comments
logger.info("Fetching comments")
cur.execute("SELECT id FROM videos")
id_list = [row[0] for row in cur.fetchall()]

for idx, video_id in enumerate(id_list):
    retries, comment_count, offset = 0, 0, 0
    
    while True:
        body = {
            "operationName": "GetVideoComments",
            "variables": {"id": video_id, "limit": limit, "offset": offset},
            "query": "query GetVideoComments($id: String!, $limit: Float, $offset: Float) { getVideoComments(id: $id, limit: $limit, offset: $offset) { ...VideoComment replyCount __typename } } fragment VideoComment on Comment { _id content liked user { _id username __typename } voteCount { positive __typename } linkedUser { _id username __typename } createdAt __typename }"
        }

        try:
            resp = requests.post(host, json=body)
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
                    insertComment(
                        cur, video_id, comment['_id'], comment['content'],
                        comment['user']['_id'], comment['user']['username'],
                        comment['user']['__typename'], comment['voteCount']['positive'],
                        comment.get('linkedUser'), comment['createdAt'], comment['replyCount']
                    )
                    comment_count += 1
            else:
                updateCommentCount(comment_count, video_id)
                break

        except (requests.RequestException, json.JSONDecodeError, TypeError) as e:
            if retries < 2:
                retries += 1
                logger.warning(f"Retry {retries}/3 for video {video_id} due to {e}")
                continue
            else:
                with open(f'{error_path}/{video_id}', 'w') as file:
                    json.dump(body, file)
                logger.error(f"Failed to fetch comments for video {video_id} after 3 retries")
                break

        offset += limit

addTimeStamp(cur)
con.close()

shutil.move("temp.db", "store.db")
logger.info("Replaced store.db with updated temp.db")

# Print runtime for script
end_time = datetime.now(timezone.utc)
duration = end_time - start_time
hours, remainder = divmod(duration.seconds, 3600)
minutes = remainder // 60

logger.info(f"Archive finished in {hours}h {minutes}min")
