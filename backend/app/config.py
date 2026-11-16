import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Lesson Quiz Generator API"
    app_version: str = "1.0.0"
    app_env: str = "development"
    debug: bool = True

    # Database
    database_url: str = "sqlite:///./quizzes.db"
    
    # MongoDB Atlas
    mongodb_url: str = Field(
        default="mongodb+srv://shamchalase_db_user:VAeVAmTO1OdOy6wq@cluster0.lzefjeu.mongodb.net/?retryWrites=true&w=majority",
        validation_alias="MONGODB_URL"
    )
    mongodb_db_name: str = Field(default="lesson_quiz_db", validation_alias="MONGODB_DB_NAME")
    use_mongodb: bool = Field(default=True, validation_alias="USE_MONGODB")

    # LLM Settings
    # Default to True so the app works out-of-the-box without requiring an API key
    mock_llm: bool = Field(default=True, validation_alias="MOCK_LLM")
    llm_provider: str = Field(default="gemini", validation_alias="LLM_PROVIDER")  # gemini, openai, groq

    gemini_api_key: str = Field(default="", validation_alias="GEMINI_API_KEY")
    openai_api_key: str = Field(default="", validation_alias="OPENAI_API_KEY")
    groq_api_key: str = Field(default="", validation_alias="GROQ_API_KEY")

    # CORS
    cors_origins: List[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
