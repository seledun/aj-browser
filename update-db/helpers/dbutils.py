"""
Docstring for update-db.helpers.dbutils
"""
from datetime import datetime, timezone
import sqlite3


def initialize_tables(cur):
    """Initialize the database tables, if they don't already exist in the database

    :param cur: SQLite cursor obj
    """

    cur.execute("PRAGMA foreign_keys = ON")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS video (
        id TEXT PRIMARY KEY NOT NULL, title TEXT, summary TEXT, playCount INTEGER,
        likeCount INTEGER, angerCount INTEGER, duration REAL, createdAt TEXT,
        commentCount INTEGER DEFAULT 0
    )
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS comment (
        id TEXT PRIMARY KEY NOT NULL, videoId TEXT, content TEXT, userId TEXT,
        username TEXT, userType TEXT, posVotes INTEGER, linkedUserName TEXT,
        linkedUserId TEXT, createdAt TEXT, replyCount INTEGER,
        FOREIGN KEY (videoId) REFERENCES video(id) ON DELETE CASCADE
    )
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS reply (
        id TEXT PRIMARY KEY NOT NULL, content TEXT, liked TEXT, userId TEXT,
        userName TEXT, voteCount INTEGER, linkedUserName TEXT, linkedUserId TEXT, createdAt TEXT,
        replyTo TEXT, FOREIGN KEY (replyTo) REFERENCES comment(id) ON DELETE CASCADE
    )
    """)
    cur.execute(
        "CREATE TABLE IF NOT EXISTS modified (id INTEGER PRIMARY KEY AUTOINCREMENT, updated TEXT)")


def setup_indexes(cur):
    """Create indexes for faster querying

    :param cur: SQLite cursor obj
    """
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_comments_videoId ON comment (videoId)")
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_replies_replyTo ON reply (replyTo)")


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
            INSERT INTO video (id, title, summary, playCount, likeCount, angerCount,
            duration, createdAt, commentCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (_id, title, summary, play_count, like_count,
              anger_count, duration, created_at, comment_count))
        return 1
    except sqlite3.IntegrityError:
        cur.execute("""
            UPDATE video
            SET playCount = ?, likeCount = ?, angerCount = ?
            WHERE id = ?
        """, (play_count, like_count, anger_count, _id))
        return 0


def add_comment(cur: sqlite3.Cursor, video_id, _id, content, user_id, username,
                user_type, pos_votes, linked_user_name, linked_user_id, created_at, reply_count):
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
    :param linkedUserName: username of linked user
    :param linkedUserId: user id of linked user
    :param createdAt: time when the comment was posted
    :param replyCount: reply count to this comment
    """
    try:
        cur.execute("""
            INSERT INTO comment (id, videoId, content, userId, username, userType,
            posVotes, linkedUserName, linkedUserId, createdAt, replyCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (_id, video_id, content, user_id, username, user_type,
              pos_votes, linked_user_name, linked_user_id, created_at, reply_count))
        return 1
    except sqlite3.IntegrityError:
        cur.execute("""
            UPDATE comment
            SET posVotes = ?, replyCount = ?
            WHERE id = ?
        """, (pos_votes, reply_count, _id))
        return 0


def add_reply(cur, _id, content, liked, user_id, user_name,
              vote_count, linked_user_name, linked_user_id, created_at, reply_to):
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
            INSERT INTO reply (id, content, liked, userId, userName,
            voteCount, linkedUserName, linkedUserId, createdAt, replyTo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (_id, content, liked, user_id, user_name, vote_count,
              linked_user_name, linked_user_id, created_at, reply_to))
        return 1
    except sqlite3.IntegrityError:
        cur.execute("""
            UPDATE reply
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
            "UPDATE video SET commentCount = ? WHERE id = ?", (count, video_id))
        return f"Updated video {video_id} with comment count {count}"


def add_timestamp(cur):
    """Adds a timestamp for the archiving

    Used when the backup is finished to display when the last fetch was completed.

    :param con: SQLite connection obj
    :param cur: SQLite cursor obj    
    """
    timestamp = datetime.now(timezone.utc).isoformat(timespec='milliseconds')
    cur.execute("INSERT INTO modified (updated) VALUES (?)", (timestamp,))
    return f"Dump finished at {timestamp}"


def get_pending_comments(cur):
    """
    Fetches only comments where the expected replyCount is greater 
    than the number of replies currently stored in the database.
    """
    query = """
        SELECT 
            c.id, 
            c.videoId, 
            c.replyCount
        FROM comment c
        LEFT JOIN (
            SELECT replyTo, COUNT(*) as actual_count 
            FROM Reply 
            GROUP BY replyTo
        ) r ON c.id = r.replyTo
        WHERE c.replyCount > 0 
        AND c.replyCount > COALESCE(r.actual_count, 0)
    """
    cur.execute(query)
    return cur.fetchall()

def get_all_video_ids(cur):
    """
    Fetches all video IDs from the Video table.
    """
    query = "SELECT id FROM video"
    cur.execute(query)
    return [row[0] for row in cur.fetchall()]

def get_comment_reply_count(cur, comment_id):
    """
    Fetches the current number of replies stored in the database for a given comment ID.
    """
    query = "SELECT COUNT(*) FROM reply WHERE replyTo = ?"
    cur.execute(query, (comment_id,))
    return cur.fetchone()[0]