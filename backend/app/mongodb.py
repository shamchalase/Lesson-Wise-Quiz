import logging
import math
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import certifi
from pymongo import MongoClient, DESCENDING
from app.config import settings

logger = logging.getLogger(__name__)


class MongoDBManager:
    """
    Manages MongoDB Atlas connection and operations for the Lesson Quiz Generator.
    Supports storing quizzes, embedded questions, and options in MongoDB.
    """

    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None
        self._connected = False
        self._init_connection()

    def _init_connection(self):
        if not settings.use_mongodb or not settings.mongodb_url:
            return

        try:
            logger.info("Connecting to MongoDB Atlas...")
            self.client = MongoClient(
                settings.mongodb_url,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=4000,
                connectTimeoutMS=4000,
                socketTimeoutMS=5000,
            )
            # Ping database to confirm connection
            self.client.admin.command("ping")
            self.db = self.client[settings.mongodb_db_name]
            self._connected = True
            
            # Create indexes
            self.db.quizzes.create_index([("created_at", DESCENDING)])
            self.db.quizzes.create_index("id", unique=True)
            logger.info(f"MongoDB Atlas successfully connected! Database: {settings.mongodb_db_name}")

        except Exception as e:
            self._connected = False
            logger.warning(
                f"Could not connect to MongoDB Atlas ({e}). "
                "Ensure your current IP is whitelisted in MongoDB Atlas Network Access (0.0.0.0/0). "
                "Falling back to local persistent SQLite database."
            )

    @property
    def is_connected(self) -> bool:
        return self._connected and self.db is not None

    def _get_next_id(self) -> int:
        """Generates an auto-incrementing integer ID for quizzes."""
        counter = self.db.counters.find_one_and_update(
            {"_id": "quiz_id"},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=True,
        )
        return counter["seq"]

    def create_quiz(self, title: str, lesson_text: str, age: int, llm_questions: list) -> Dict[str, Any]:
        """Saves a new quiz into the MongoDB quizzes collection."""
        quiz_id = self._get_next_id()
        now = datetime.now(timezone.utc)

        formatted_questions = []
        for q_idx, q_item in enumerate(llm_questions, 1):
            formatted_options = [
                {
                    "id": (q_idx * 10) + o_idx,
                    "option_text": opt.option_text,
                    "is_correct": opt.is_correct,
                }
                for o_idx, opt in enumerate(q_item.options, 1)
            ]
            formatted_questions.append({
                "id": q_idx,
                "question_text": q_item.question_text,
                "explanation": q_item.explanation,
                "options": formatted_options,
            })

        doc = {
            "id": quiz_id,
            "title": title,
            "lesson_text": lesson_text,
            "age": age,
            "created_at": now,
            "questions": formatted_questions,
        }

        self.db.quizzes.insert_one(doc)
        doc.pop("_id", None)
        return doc

    def list_quizzes(self, page: int = 1, size: int = 10) -> Dict[str, Any]:
        """Lists quizzes sorted newest first with pagination."""
        total = self.db.quizzes.count_documents({})
        offset = (page - 1) * size

        cursor = (
            self.db.quizzes.find({}, {"_id": 0, "lesson_text": 0})
            .sort("created_at", DESCENDING)
            .skip(offset)
            .limit(size)
        )

        items = []
        for q in cursor:
            items.append({
                "id": q["id"],
                "title": q["title"],
                "age": q["age"],
                "created_at": q["created_at"],
                "question_count": len(q.get("questions", [])) if "questions" in q else 5,
            })

        pages = math.ceil(total / size) if total > 0 else 1

        return {
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": pages,
        }

    def get_quiz(self, quiz_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves a single quiz by its integer ID."""
        doc = self.db.quizzes.find_one({"id": quiz_id}, {"_id": 0})
        return doc

    def delete_quiz(self, quiz_id: int) -> bool:
        """Deletes a quiz by its integer ID."""
        res = self.db.quizzes.delete_one({"id": quiz_id})
        return res.deleted_count > 0


mongo_manager = MongoDBManager()
