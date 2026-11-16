import math
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func

from app.database import get_db
from app.models import Quiz, Question, Option
from app.schemas import (
    QuizCreateRequest,
    QuizDetailResponse,
    QuizListResponse,
    QuizSummaryResponse,
)
from app.services.llm_service import LLMService, LLMServiceError
from app.mongodb import mongo_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/quizzes", tags=["Quizzes"])
llm_service = LLMService()


@router.post(
    "",
    response_model=QuizDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new 5-question quiz from lesson text"
)
def create_quiz(payload: QuizCreateRequest, db: Session = Depends(get_db)):
    """
    Accepts lesson text, title, and target age (8-14).
    Validates input bounds (50 - 5,000 chars for lesson_text).
    Prompts the LLM (or mock generator) to construct 5 multiple-choice questions
    with exactly 4 options each and 1 correct answer.
    Saves everything into MongoDB (or falls back to SQLite) and returns the created quiz.
    """
    raw_length = len(payload.lesson_text.strip())
    if raw_length < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lesson text must be at least 50 characters (received {raw_length})."
        )
    if raw_length > 5000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lesson text cannot exceed 5,000 characters (received {raw_length})."
        )
    if payload.age < 8 or payload.age > 14:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target age must be between 8 and 14 years old (received {payload.age})."
        )

    # Generate quiz using LLM service
    try:
        llm_output = llm_service.generate_quiz(
            title=payload.title,
            lesson_text=payload.lesson_text,
            age=payload.age,
        )
    except LLMServiceError as e:
        logger.error(f"Quiz generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate quiz: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error during quiz generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while generating quiz questions."
        )

    # 1. Route to MongoDB if connected
    if mongo_manager.is_connected:
        try:
            return mongo_manager.create_quiz(
                title=payload.title,
                lesson_text=payload.lesson_text,
                age=payload.age,
                llm_questions=llm_output.questions,
            )
        except Exception as e:
            logger.error(f"MongoDB write failed: {e}. Falling back to SQLite...")

    # 2. SQLite Fallback Persistence
    try:
        db_quiz = Quiz(
            title=payload.title,
            lesson_text=payload.lesson_text,
            age=payload.age,
        )
        db.add(db_quiz)
        db.flush()

        for q_idx, q_item in enumerate(llm_output.questions):
            db_question = Question(
                quiz_id=db_quiz.id,
                question_text=q_item.question_text,
                explanation=q_item.explanation,
            )
            db.add(db_question)
            db.flush()

            for o_item in q_item.options:
                db_option = Option(
                    question_id=db_question.id,
                    option_text=o_item.option_text,
                    is_correct=o_item.is_correct,
                )
                db.add(db_option)

        db.commit()
        db.refresh(db_quiz)
        return db_quiz

    except Exception as e:
        db.rollback()
        logger.error(f"Database error while saving quiz: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save quiz in the database."
        )


@router.get(
    "",
    response_model=QuizListResponse,
    summary="List saved quizzes with pagination (newest first)"
)
def list_quizzes(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Returns a paginated list of quizzes sorted newest first.
    Queries MongoDB when connected, or falls back to SQLite.
    """
    if mongo_manager.is_connected:
        try:
            return mongo_manager.list_quizzes(page=page, size=size)
        except Exception as e:
            logger.error(f"MongoDB list query failed: {e}. Falling back to SQLite...")

    total = db.query(func.count(Quiz.id)).scalar() or 0
    offset = (page - 1) * size

    quizzes = (
        db.query(Quiz)
        .options(joinedload(Quiz.questions))
        .order_by(desc(Quiz.created_at))
        .offset(offset)
        .limit(size)
        .all()
    )

    items = [
        QuizSummaryResponse(
            id=q.id,
            title=q.title,
            age=q.age,
            created_at=q.created_at,
            question_count=len(q.questions),
        )
        for q in quizzes
    ]

    pages = math.ceil(total / size) if total > 0 else 1

    return QuizListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get(
    "/{quiz_id}",
    response_model=QuizDetailResponse,
    summary="Get single quiz by ID with questions, options, and correct answers"
)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    """
    Returns a single quiz with its 5 questions, options, and correct answers.
    """
    if mongo_manager.is_connected:
        try:
            quiz = mongo_manager.get_quiz(quiz_id)
            if quiz:
                return quiz
        except Exception as e:
            logger.error(f"MongoDB fetch query failed: {e}. Checking SQLite...")

    quiz = (
        db.query(Quiz)
        .options(
            joinedload(Quiz.questions).joinedload(Question.options)
        )
        .filter(Quiz.id == quiz_id)
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz with ID {quiz_id} not found."
        )

    return quiz


@router.delete(
    "/{quiz_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a quiz by ID"
)
def delete_quiz(quiz_id: int, db: Session = Depends(get_db)):
    """Deletes a quiz and cascades deletion."""
    deleted_mongo = False
    if mongo_manager.is_connected:
        try:
            deleted_mongo = mongo_manager.delete_quiz(quiz_id)
        except Exception as e:
            logger.error(f"MongoDB deletion failed: {e}")

    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if quiz:
        db.delete(quiz)
        db.commit()
        return None

    if deleted_mongo:
        return None

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Quiz with ID {quiz_id} not found."
    )
