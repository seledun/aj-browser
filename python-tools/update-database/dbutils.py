from datetime import datetime, timezone
import sqlite3

def initializeTables(cur: sqlite3.Cursor):
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
    cur.execute("CREATE TABLE IF NOT EXISTS updated (id INTEGER PRIMARY KEY AUTOINCREMENT, updated TEXT)")

def addVideo(con: sqlite3.Connection, cur: sqlite3.Cursor, id, title, summary, playCount, likeCount, angerCount, duration, createdAt, commentCount):
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
        """, (id, title, summary, playCount, likeCount, angerCount, duration, createdAt, commentCount))
        con.commit()
        return f"Added video {id}"
    except sqlite3.IntegrityError:
        cur.execute("""
            UPDATE videos
            SET playCount = ?, likeCount = ?, angerCount = ?
            WHERE id = ?
        """, (playCount, likeCount, angerCount, id))
        con.commit()
        return f"Video {id} already exists in the database, updating values."

def addComment(con: sqlite3.Connection, cur: sqlite3.Cursor, videoId, id, content, userId, username, userType, posVotes, linkedUser, createdAt, replyCount):
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
        """, (id, videoId, content, userId, username, userType, posVotes, linkedUser, createdAt, replyCount))
        con.commit()
        return f"Added comment {id}"
    except sqlite3.IntegrityError:
        cur.execute("""
            UPDATE comments
            SET posVotes = ?, replyCount = ?
            WHERE id = ?
        """, (posVotes, replyCount, id))
        return f"Comment {id} already exists in the database, updating values."
    
def addReply(con: sqlite3.Connection, cur: sqlite3.Cursor, id, content, liked, userId, userName, voteCount, linkedUser, createdAt, replyTo):
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
        """, (id, content, liked, userId, userName, voteCount, linkedUser, createdAt, replyTo))
        con.commit()
        return f"Added comment {id}"
    except sqlite3.IntegrityError:
        cur.execute("""
            UPDATE replies
            SET voteCount = ?
            WHERE id = ?
        """, (voteCount, id))
        return f"Comment {id} already exists in the database, updating values."

def addCommentCount(con: sqlite3.Connection, cur: sqlite3.Cursor, count, video_id):
    """Update the comment count for a specific video
    
    :param con: SQLite connection obj
    :param cur: SQLite cursor obj
    :param count: Updated count
    :param video_id: Video ID
    """
    if count > 0:  # Default value = 0 in database
        cur.execute("UPDATE videos SET commentCount = ? WHERE id = ?", (count, video_id))
        con.commit()
        return f"Updated video {video_id} with comment count {count}"

def addTimeStamp(con: sqlite3.Connection, cur: sqlite3.Cursor):
    """Adds a timestamp for the archiving

    Used when the backup is finished to display when the last fetch was completed.

    :param con: SQLite connection obj
    :param cur: SQLite cursor obj    
    """
    timestamp = datetime.now(timezone.utc).isoformat(timespec='milliseconds')
    cur.execute("INSERT INTO updated (updated) VALUES (?)", (timestamp,))
    con.commit()
    return f"Dump finished at {timestamp}"

def getAllComments(cur: sqlite3.Cursor):
    """Get all currently stored comments
    
    :param cur: SQLite cursor obj
    """
    cur.execute("SELECT id, videoId, replyCount FROM comments WHERE replyCount > 0")
    return cur.fetchall()