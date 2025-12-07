# Backend/db.py
import os
import logging
import certifi
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

MONGO_URI = os.getenv("MONGO_URI", "")
MONGO_DBNAME = os.getenv("MONGO_DBNAME", "")  # optional fallback DB name

if not MONGO_URI:
    logger.error("MONGO_URI not set in environment.")
    raise RuntimeError("MONGO_URI environment variable is required")

client: MongoClient | None = None
db = None

def _connect():
    global client, db

    if client is not None and db is not None:
        return

    try:
        # Use certifi bundle to avoid macOS SSL cert verification issues
        client = MongoClient(MONGO_URI, tls=True, tlsCAFile=certifi.where())

        # Try default DB from URI first (works if URI ends with /dbname)
        try:
            db = client.get_default_database()
        except Exception:
            db = None

        # If no default DB in URI, fall back to explicit env var
        if db is None:
            if MONGO_DBNAME:
                db = client[MONGO_DBNAME]
                logger.info("Using MONGO_DBNAME fallback: %s", MONGO_DBNAME)
            else:
                msg = (
                    "No default database defined in MONGO_URI and MONGO_DBNAME not set. "
                    "Either add '/your_db_name' to MONGO_URI or set MONGO_DBNAME env var."
                )
                logger.error(msg)
                raise RuntimeError(msg)

        logger.info("MongoDB connected successfully to database: %s", db.name)

    except PyMongoError as e:
        logger.exception("MongoClient creation failed: %s", e)
        raise

# Connect immediately on import so other modules can just `from db import db`
_connect()

def connect_db():
    return db
