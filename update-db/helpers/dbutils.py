"""
Docstring for update-db.helpers.dbutils
"""
from datetime import datetime, timezone
import sqlite3

def initialize_tables(cur):
    """Initialize the database tables, if they don't already exist in the database

    :param cur: SQLite cursor obj
    """
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
    cur.execute("""
        CREATE TABLE IF NOT EXISTS replies (
            id TEXT NOT NULL UNIQUE, content TEXT, liked TEXT, userId TEXT,
            userName TEXT, voteCount INTEGER, linkedUser TEXT, createdAt TEXT,
            replyTo TEXT
        )
    """)
    cur.execute(
        "CREATE TABLE IF NOT EXISTS updated (id INTEGER PRIMARY KEY AUTOINCREMENT, updated TEXT)")


def add_video(cur, _id, title, summary, play_count, like_count,
              anger_count, duration, created_at, comment_count):
    """Adds or updates video in the database depending on the context.

    :param con: SQLite connection obj
    :param cur: SQLite cursor obj
    :param id: Video id matching banned.video format
    :param title: Display title of the video
    :param summary: Summary for the video
    :param playCount: Play count
    :param likeCount: Like count
    :param duration: Video duration
    :param createdAt: Posted at
    :param commentCount: Number of comments
    """
    try:
        cur.execute("""
            INSERT INTO videos (id, title, summary, playCount, likeCount, angerCount,
            duration, createdAt, commentCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (_id, title, summary, play_count, like_count,
              anger_count, duration, created_at, comment_count))
        return 1
    except sqlite3.IntegrityError:
        cur.execute("""
            UPDATE videos
            SET playCount = ?, likeCount = ?, angerCount = ?
            WHERE id = ?
        """, (play_count, like_count, anger_count, _id))
        return 0


def add_comment(cur: sqlite3.Cursor, video_id, _id, content, user_id, username,
                user_type, pos_votes, linked_user, created_at, reply_count):
    """Adds or updates comments in the database depending on the context.

    :param con: SQLite connection obj
    :param cur: SQLite cursor obj
    :param videoId: id of the video
    :param id: comment id
    :param content: text content of the comment
    :param userId: id of the commenting user
    :param username: username of the commenting user
    :param userType: not sure
    :param posVotes: upvotes for the comment
    :param linkedUser: not sure
    :param createdAt: time when the comment was posted
    :param replyCount: reply count to this comment
    """
    try:
        cur.execute("""
            INSERT INTO comments (id, videoId, content, userId, username, userType,
            posVotes, linkedUser, createdAt, replyCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (_id, video_id, content, user_id, username, user_type,
              pos_votes, linked_user, created_at, reply_count))
        return 1
    except sqlite3.IntegrityError:
        cur.execute("""
            UPDATE comments
            SET posVotes = ?, replyCount = ?
            WHERE id = ?
        """, (pos_votes, reply_count, _id))
        return 0


def add_reply(cur, _id, content, liked, user_id, user_name,
              vote_count, linked_user, created_at, reply_to):
    """Adds or updates replies in the database depending on the context.

    :param con: SQLite connection obj
    :param cur: SQLite cursor obj
    :param videoId: id of the video
    :param id: comment id
    :param content: text content of the comment
    :param userId: id of the commenting user
    :param username: username of the commenting user
    :param userType: not sure
    :param posVotes: upvotes for the comment
    :param linkedUser: not sure
    :param createdAt: time when the comment was posted
    :param replyCount: reply count to this comment
    """
    try:
        cur.execute("""
            INSERT INTO replies (id, content, liked, userId, userName,
            voteCount, linkedUser, createdAt, replyTo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (_id, content, liked, user_id, user_name, vote_count,
              linked_user, created_at, reply_to))
        return 1
    except sqlite3.IntegrityError:
        cur.execute("""
            UPDATE replies
            SET voteCount = ?
            WHERE id = ?
        """, (vote_count, _id))
        return 0


def add_comment_count(cur, count, video_id):
    """Update the comment count for a specific video

    :param con: SQLite connection obj
    :param cur: SQLite cursor obj
    :param count: Updated count
    :param video_id: Video ID
    """
    if count > 0:  # Default value = 0 in database
        cur.execute(
            "UPDATE videos SET commentCount = ? WHERE id = ?", (count, video_id))
        return f"Updated video {video_id} with comment count {count}"


def add_timestamp(cur):
    """Adds a timestamp for the archiving

    Used when the backup is finished to display when the last fetch was completed.

    :param con: SQLite connection obj
    :param cur: SQLite cursor obj    
    """
    timestamp = datetime.now(timezone.utc).isoformat(timespec='milliseconds')
    cur.execute("INSERT INTO updated (updated) VALUES (?)", (timestamp,))
    return f"Dump finished at {timestamp}"


def get_all_comments(cur):
    """Get all currently stored comments

    :param cur: SQLite cursor obj
    """
    cur.execute(
        "SELECT id, videoId, replyCount FROM comments WHERE replyCount > 0")
    return cur.fetchall()
