"""Configuration settings for update-db script"""
from datetime import datetime
import logging
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def get_path(rel):
    """Get absolute path based on relative path"""
    return os.path.join(BASE_DIR, rel)


HOST = "https://api.banned.video/graphql"
CHANNEL_ID = "5b885d33e6646a0015a6fa2d"
REPLY_ERROR_PATH = get_path("errors/reply-errors")
COMMENT_ERROR_PATH = get_path("errors/comment-errors")
MAIN_DB_PATH = get_path("../prisma/store.db")
TEMP_DB_PATH = get_path("temp.db")
LOG_DIR = get_path("logs")

# Number of items to fetch per request
LIMIT = 500             # Number of items to fetch per request

# DLQ settings
EXP_BACKOFF_LIMIT = 50  # Used as initial limit for the exp. backoff

LOG_LEVEL = logging.INFO
# LOG_LEVEL = logging.WARNING

os.makedirs(COMMENT_ERROR_PATH, exist_ok=True)
os.makedirs(REPLY_ERROR_PATH, exist_ok=True)

# Set up logging
LOG_FILE = f"{LOG_DIR}/{datetime.now().strftime('%y-%m-%d-%H-%M')}.txt"

def setup_logger():
    """Sets up the logger for the application"""
    os.makedirs(LOG_DIR, exist_ok=True)
    logging.basicConfig(
        filename=f'{LOG_DIR}/current.txt',
        level=LOG_LEVEL,
        format='%(asctime)s %(levelname)s [%(name)s]: %(message)s',
        filemode='w+'
    )
    return logging.getLogger()
