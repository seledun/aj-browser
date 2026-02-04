# pylint: disable=C0103

"""
Script to update the local database with new videos, comments, and replies from the API.
Author: (sl3) seledun@github
Date Created: 2025-02-28
Date Updated: 2026-02-04
"""

import os
import json
import sqlite3
import logging
import shutil
from datetime import datetime, timezone
from pydantic import ValidationError, TypeAdapter

from helpers import validator as pyd
from helpers import get_request_bodies
from helpers import dbutils

import requests

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def get_path(relative_path):
    """Joins the script's base directory with a relative path"""
    return os.path.join(BASE_DIR, relative_path)


HOST = "https://api.banned.video/graphql"
CHANNEL_ID = "5b885d33e6646a0015a6fa2d"
REPLY_ERROR_PATH = get_path("errors/reply-errors")
COMMENT_ERROR_PATH = get_path("errors/comment-errors")
MAIN_DB_PATH = get_path("../prisma/store.db")
TEMP_DB_PATH = get_path("temp.db")
LOG_DIR = get_path("logs")

EXP_BACKOFF_LIMIT = 50  # Used as initial limit for the exp. backoff
LIMIT = 500             # Number of items to fetch per request

LOG_LEVEL = logging.INFO
# LOG_LEVEL = logging.WARNING

os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(COMMENT_ERROR_PATH, exist_ok=True)
os.makedirs(REPLY_ERROR_PATH, exist_ok=True)

# Set up logging
LOG_FILE = f"{LOG_DIR}/{datetime.now().strftime('%y-%m-%d-%H-%M')}.txt"

logging.basicConfig(filename=f'{LOG_DIR}/current.txt',
                    level=LOG_LEVEL,
                    format='%(asctime)s %(levelname)s: %(message)s',
                    filemode='w+'
                    )

logger = logging.getLogger(__name__)

# Copy the database to not update it in place
shutil.copyfile(MAIN_DB_PATH, TEMP_DB_PATH)
logger.info("Copied database: store.db → temp.db")

# Create database connection and cursor
logger.info("Connecting to database and initializing tables")
start_time = datetime.now(timezone.utc)
con = sqlite3.connect(TEMP_DB_PATH)
cur = con.cursor()
dbutils.initialize_tables(cur)
dbutils.setup_indexes(cur)
con.commit()

# Stat counters
new_videos = 0
new_comments = 0
new_replies = 0

# Fetch all videos
logger.info("Fetching videos from %s", HOST)
total_videos = 0
offset = 0
while True:
    body = get_request_bodies.get_video_request_body(CHANNEL_ID, LIMIT, offset)
    try:
        resp = requests.post(HOST, json=body, timeout=30)
        resp.raise_for_status()
        obj = resp.json()

        validation = pyd.GetChannelVideosResponse.model_validate(obj)
        if isinstance(validation, pyd.GetChannelVideosResponse):
            videos = validation.data.getChannel.videos

            logger.info("Fetched %d videos @ offset %d", len(videos), offset)
            for video in videos:
                new_videos += dbutils.add_video(cur, video.id, video.title,
                                                video.summary, video.playCount, video.likeCount,
                                                video.angerCount, video.videoDuration,
                                                video.createdAt, None)
                total_videos += 1

            if len(videos) < LIMIT:
                break

        else:
            logger.error("[%s] @ offset %d contains error", CHANNEL_ID, offset)

    except (AttributeError) as e:
        logger.error(e)

    except (requests.RequestException, requests.HTTPError):
        logger.error("Video fetch failed @ offset %s", offset)

    except (json.JSONDecodeError, TypeError, ValidationError):
        logger.error("Malformed video response @ offset %d", offset)

    offset += LIMIT
con.commit()

# Fetch all comments
logger.info("Fetching all video comments")
id_list = dbutils.get_all_video_ids(cur)
counter = 0

for idx, video_id in enumerate(id_list):
    retries, comment_count, offset = 0, 0, 0
    logger.info("[%s] fetching comments (%d/%d)",
                video_id, counter, total_videos)
    counter += 1

    while True:
        body = get_request_bodies.get_comment_request_body(
            video_id, LIMIT, offset)
        try:
            resp = requests.post(HOST, json=body, timeout=30)
            resp.raise_for_status()
            obj = resp.json()

            adapter = TypeAdapter(pyd.GetVideoCommentsUnion)
            validation = adapter.validate_python(obj)

            if isinstance(validation, pyd.GetVideoCommentsResponse):
                comments = validation.data.getVideoComments

                logger.info("[%s] fetched %d comments @ offset %d",
                            video_id, len(comments), offset)
                for comment in comments:
                    linked_user_name = None
                    linked_user_id = None
                    if comment.linkedUser:
                        linked_user_name = comment.linkedUser.username
                        linked_user_id = comment.linkedUser.id
                    new_comments += dbutils.add_comment(
                        cur, video_id, comment.id, comment.content,
                        comment.user.id, comment.user.username,
                        comment.user.typename, comment.voteCount.positive,
                        linked_user_name, linked_user_id, comment.createdAt, comment.replyCount
                    )
                    comment_count += 1

                # Don't need to query the next page if this is not full
                if len(comments) < LIMIT:
                    dbutils.add_comment_count(cur, comment_count, video_id)
                    break

            else:
                logger.error("[%s] @ offset %d contains error",
                             video_id, offset)
                with open(f'{COMMENT_ERROR_PATH}/{video_id}', 'w', encoding="UTF-8") as file:
                    json.dump(body, file)
                logger.error(
                    "[%s] failed fetching comments after 3 retries", video_id)
                break

        except (requests.RequestException, requests.HTTPError) as e:
            if retries < 2:
                retries += 1
                logger.warning("[%s] retry %d/3 due to %s",
                               video_id, retries, e)
                continue

            with open(f'{COMMENT_ERROR_PATH}/{video_id}', 'w', encoding="UTF-8") as file:
                json.dump(body, file)
                logger.error(
                    "[%s] failed fetching comments after 3 retries", video_id)
                break

        except (json.JSONDecodeError, TypeError, ValidationError):
            logger.error("[%s] malformed response @ offset %d",
                         video_id, offset)
            break

        offset += LIMIT
con.commit()

# Trying to resolve comment errors
logger.info("Resolving comment errors")
ids_to_fetch = os.listdir(COMMENT_ERROR_PATH)

for counter, video_id in enumerate(ids_to_fetch):
    offset = 0
    comment_count = 0

    logger.info("[%s] retrying comments (%d/%d)",
                video_id, counter, len(ids_to_fetch))
    current_limit = EXP_BACKOFF_LIMIT

    while True:
        body = get_request_bodies.get_comment_request_body(
            video_id, current_limit, offset)
        try:
            resp = requests.post(HOST, json=body, timeout=30)
            resp.raise_for_status()
            obj = json.loads(resp.text)

            validation = pyd.GetVideoCommentsUnion(obj)
            if isinstance(validation, pyd.GetVideoCommentsResponse):
                comments = validation.data.getVideoComments
                for comment in comments:
                    linked_user_name = None
                    linked_user_id = None
                    if comment.linkedUser:
                        linked_user_name = comment.linkedUser.username
                        linked_user_id = comment.linkedUser.id
                    new_comments += dbutils.add_comment(
                        cur, video_id, comment.id, comment.content,
                        comment.user.id, comment.user.username,
                        comment.user.typename, comment.voteCount.positive,
                        linked_user_name, linked_user_id, comment.createdAt, comment.replyCount
                    )
                    logger.info("[%s] added comment @ %s", video_id, offset)
                    comment_count += 1

                offset += len(comments)
                current_limit = EXP_BACKOFF_LIMIT

                if len(validation.data.getVideoComments) == 0:
                    logger.info("[%s] no more comments to index", video_id)
                    break

            else:
                logger.warning(
                    "[%s] bad comment @ offset %s with limit %s", video_id, offset, current_limit)

                if current_limit == 1:
                    logger.warning(
                        "[%s] skipping bad comment @ offset %s", video_id, offset)
                    offset += 1
                    current_limit = EXP_BACKOFF_LIMIT
                    continue

                current_limit = max(1, current_limit // 2)
                continue

        except requests.RequestException as e:
            logger.error("[%s] request error @ offset %s",
                         video_id, offset)
            break
        
        except (json.JSONDecodeError, TypeError, ValidationError):
            logger.error(
                "[%s] malformed response @ offset %s", video_id, offset)
            break

    logger.info("[%s] Done — %d recovered comments", video_id, comment_count)
    dbutils.add_comment_count(cur, comment_count, video_id)
    os.remove(f"{COMMENT_ERROR_PATH}/{video_id}")
con.commit()

# Fetch all comment replies
logger.info("Fetching comment replies")
comments = dbutils.get_pending_comments(cur)
counter = 0

for idx, (comment_id, video_id, reply_count) in enumerate(comments):
    retries, reply_count_fetched, offset = 0, 0, 0
    logger.info("[%s] fetching replies (%d/%d)",
                comment_id, counter, len(comments))
    counter += 1

    while True:
        body = get_request_bodies.get_comment_replies_request_body(
            comment_id, LIMIT, offset)

        try:
            resp = requests.post(HOST, json=body, timeout=30)
            resp.raise_for_status()
            obj = resp.json()

            adapter = TypeAdapter(pyd.GetCommentRepliesUnion)
            validation = adapter.validate_python(obj)

            if isinstance(validation, pyd.GetCommentRepliesResponse):
                replies = validation.data.getCommentReplies
                logger.info(
                    "[%s] %d replies @ offset %d", comment_id, len(replies), offset)
                for reply in replies:
                    linked_user_name = None
                    linked_user_id = None
                    if reply.linkedUser:
                        linked_user_name = reply.linkedUser.username
                        linked_user_id = reply.linkedUser.id
                    new_replies += dbutils.add_reply(
                        cur, reply.id, reply.content,
                        reply.liked, reply.user.id,
                        reply.user.username, reply.voteCount.positive,
                        linked_user_name, linked_user_id, reply.createdAt, reply.replyTo.id
                    )
                    reply_count_fetched += 1

                # Don't need to query the next page if this is not full
                if len(replies) < LIMIT:
                    logger.info("[%s] no replies @ offset %d",
                                comment_id, offset)
                    break
            else:
                logger.error("[%s] bad response @ offset %d",
                             comment_id, offset)
                with open(f'{REPLY_ERROR_PATH}/{comment_id}', 'w', encoding="UTF-8") as file:
                    json.dump(body, file)
                logger.error(
                    "[%s] failed to fetch replies after 3 retries", comment_id)
                break

        except (requests.RequestException) as e:
            if retries < 2:
                retries += 1
                logger.warning("[%s] retry %d/3 due to %s",
                               comment_id, retries, e)
                continue
            with open(f'{REPLY_ERROR_PATH}/{comment_id}', 'w', encoding="UTF-8") as file:
                json.dump(body, file)
            logger.error(
                "[%s] failed to fetch replies after 3 retries", comment_id)
            break

        except (json.JSONDecodeError, TypeError, ValidationError):
            logger.error("[%s] malformed response @ offset %d",
                         comment_id, offset)
            break

        offset += LIMIT
con.commit()

# Trying to resolve reply errors (exponential back-off)
logger.info("Resolving reply errors")
ids_to_fetch = os.listdir(REPLY_ERROR_PATH)

for counter, comment_id in enumerate(ids_to_fetch):
    offset = 0
    reply_count_fetched = 0
    current_limit = EXP_BACKOFF_LIMIT

    logger.info(
        "[%s] retrying replies (%d/%d)", comment_id, counter, len(ids_to_fetch))

    while True:
        body = get_request_bodies.get_comment_replies_request_body(
            comment_id, current_limit, offset
        )

        try:
            resp = requests.post(HOST, json=body, timeout=30)
            obj = resp.json()

            adapter = TypeAdapter(pyd.GetCommentRepliesUnion)
            validation = adapter.validate_python(obj)

            if isinstance(validation, pyd.GetCommentRepliesResponse):
                replies = validation.data.getCommentReplies
                for reply in replies:
                    linked_user_name = None
                    linked_user_id = None
                    if reply.linkedUser:
                        linked_user_name = reply.linkedUser.username
                        linked_user_id = reply.linkedUser.id
                    new_replies += dbutils.add_reply(
                        cur, reply.id, reply.content,
                        reply.liked, reply.user.id,
                        reply.user.username,
                        reply.voteCount.positive,
                        linked_user_name, linked_user_id, reply.createdAt,
                        reply.replyTo.id
                    )

                    logger.info("[%s] added reply @ %d", comment_id, offset)
                    reply_count_fetched += 1

                if len(replies) == 0:
                    logger.info("[%s] no more replies to index", comment_id)
                    break

                offset += len(replies)
                current_limit = EXP_BACKOFF_LIMIT

            else:
                logger.warning(
                    "[%s] bad reply @ offset %d with limit %d", comment_id, offset, current_limit
                )

                if current_limit == 1:
                    logger.warning(
                        "[%s] skipping poisoned reply @ offset %d", comment_id, offset
                    )
                    offset += 1
                    current_limit = EXP_BACKOFF_LIMIT
                else:
                    current_limit = max(1, current_limit // 2)

                continue

        except (requests.RequestException):
            logger.error("[%s] request error @ offset %d",
                         comment_id, offset)
            break
        except (json.JSONDecodeError, TypeError, ValidationError):
            logger.error("[%s] malformed response @ offset %d",
                         comment_id, offset)
            break

    logger.info("[%s] done, got %d replies", comment_id, reply_count_fetched)
    os.remove(f"{REPLY_ERROR_PATH}/{comment_id}")

# Clean-up and timestamp database
dbutils.add_timestamp(cur)
con.commit()
con.close()
logger.info("Added timestamp and closed database")

shutil.move(TEMP_DB_PATH, MAIN_DB_PATH)
logger.info("Database updated successfully (temp.db → store.db)")

# Print run-time information
end_time = datetime.now(timezone.utc)
duration = end_time - start_time
hours, remainder = divmod(duration.seconds, 3600)
minutes = remainder // 60

# Log summary
summary = f"""**Archive Summary**
- Finished in: {hours}h {minutes}m
- New videos: {new_videos}
- New comments: {new_comments}
- New replies: {new_replies}
- Comments DLQ size: {len(os.listdir(COMMENT_ERROR_PATH))}
- Reply DLQ size: {len(os.listdir(REPLY_ERROR_PATH))}
"""
logger.info(summary)
shutil.copy(f"{LOG_DIR}/current.txt", LOG_FILE)
