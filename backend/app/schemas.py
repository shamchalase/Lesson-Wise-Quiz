from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


# ==========================================
# Client Request / Response Schemas
# ==========================================

class QuizCreateRequest(BaseModel):
    title: str = Field(..., description="Quiz title", min_length=1, max_length=200)
    lesson_text: str = Field(..., description="Lesson text to generate quiz from (50 - 5000 characters)")
    age: int = Field(..., description="Target age of kids (8 - 14)")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Title cannot be empty or only whitespace.")
        return trimmed

    @field_validator("lesson_text")
    @classmethod
    def validate_lesson_text(cls, v: str) -> str:
        trimmed = v.strip()
        length = len(trimmed)
        if length < 50:
            raise ValueError(f"Lesson text is too short ({length} characters). It must be at least 50 characters.")
        if length > 5000:
            raise ValueError(f"Lesson text is too long ({length} characters). It cannot exceed 5,000 characters.")
        return trimmed

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: int) -> int:
        if v < 8 or v > 14:
            raise ValueError(f"Target age must be between 8 and 14 years old (received {v}).")
        return v


class OptionResponse(BaseModel):
    id: int
    option_text: str
    is_correct: bool

    model_config = {"from_attributes": True}


class QuestionResponse(BaseModel):
    id: int
    question_text: str
    explanation: Optional[str] = None
    options: List[OptionResponse]

    model_config = {"from_attributes": True}


class QuizDetailResponse(BaseModel):
    id: int
    title: str
    lesson_text: str
    age: int
    created_at: datetime
    questions: List[QuestionResponse]

    model_config = {"from_attributes": True}


class QuizSummaryResponse(BaseModel):
    id: int
    title: str
    age: int
    created_at: datetime
    question_count: int

    model_config = {"from_attributes": True}


class QuizListResponse(BaseModel):
    items: List[QuizSummaryResponse]
    total: int
    page: int
    size: int
    pages: int


# ==========================================
# LLM Output Validation Schemas
# ==========================================

class LLMOptionItem(BaseModel):
    option_text: str = Field(..., min_length=1)
    is_correct: bool = Field(default=False)

    @field_validator("option_text")
    @classmethod
    def clean_text(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Option text cannot be empty.")
        return clean


class LLMQuestionItem(BaseModel):
    question_text: str = Field(..., min_length=3)
    explanation: Optional[str] = Field(default=None)
    options: List[LLMOptionItem]

    @field_validator("question_text")
    @classmethod
    def clean_question(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Question text cannot be empty.")
        return clean

    @field_validator("options")
    @classmethod
    def validate_options(cls, v: List[LLMOptionItem]) -> List[LLMOptionItem]:
        if len(v) != 4:
            raise ValueError(f"Each question must have exactly 4 options (received {len(v)}).")
        
        correct_count = sum(1 for opt in v if opt.is_correct)
        if correct_count != 1:
            raise ValueError(f"Each question must have exactly 1 correct answer (found {correct_count}).")
        
        return v


class LLMQuizPayload(BaseModel):
    questions: List[LLMQuestionItem]

    @field_validator("questions")
    @classmethod
    def validate_questions_count(cls, v: List[LLMQuestionItem]) -> List[LLMQuestionItem]:
        if len(v) != 5:
            raise ValueError(f"Quiz must have exactly 5 questions (received {len(v)}).")
        return v

