import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.database import engine, Base
from app.routers import quizzes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("lesson_quiz_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info(f"Database initialized. Mock LLM: {settings.mock_llm}, Provider: {settings.llm_provider}")
    yield
    # Shutdown
    logger.info("Shutting down application...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API for generating 5-question multiple choice quizzes for kids aged 8-14 using LLMs.",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom validation error handler: returns clear descriptive detail message with HTTP 400
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_messages = []
    for err in exc.errors():
        msg = err.get("msg", "Invalid value")
        # Strip internal pydantic prefixes if present (e.g. "Value error, ")
        if msg.startswith("Value error, "):
            msg = msg[len("Value error, "):]
        error_messages.append(msg)
    
    primary_detail = "; ".join(error_messages) if error_messages else "Validation error"
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": primary_detail, "errors": error_messages}
    )


# Register Routers
app.include_router(quizzes.router)


@app.get("/", tags=["General"])
def root():
    return {
        "message": "Lesson Quiz Generator API is running!",
        "version": settings.app_version,
        "docs": "/docs",
        "mock_llm": settings.mock_llm,
    }


@app.get("/api/health", tags=["General"])
def health_check():
    return {
        "status": "healthy",
        "mock_mode": settings.mock_llm,
        "provider": settings.llm_provider,
    }
