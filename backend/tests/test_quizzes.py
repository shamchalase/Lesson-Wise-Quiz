import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.config import settings

# Ensure mock mode is activated during test runs
settings.mock_llm = True

# Setup isolated in-memory SQLite database for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


VALID_LESSON = (
    "Photosynthesis is the wonderful process that green plants use to convert sunlight, "
    "water, and carbon dioxide into food and oxygen! The green pigment called chlorophyll "
    "in plant leaves absorbs sunlight. Plants take in water from their roots and carbon dioxide "
    "from the air. Through this chemical process, they produce glucose for energy and release "
    "fresh oxygen for humans and animals to breathe."
)


def test_create_quiz_success(client):
    """
    Test 1: Verify quiz creation with valid inputs.
    Must generate exactly 5 questions, each with 4 options and 1 correct answer.
    """
    payload = {
        "title": "Plant Superpowers: Photosynthesis",
        "lesson_text": VALID_LESSON,
        "age": 10
    }
    response = client.post("/api/quizzes", json=payload)
    assert response.status_code == 201, response.text
    data = response.json()

    assert data["id"] is not None
    assert data["title"] == payload["title"]
    assert data["age"] == 10
    assert len(data["questions"]) == 5

    for q in data["questions"]:
        assert len(q["options"]) == 4
        correct_count = sum(1 for opt in q["options"] if opt["is_correct"] is True)
        assert correct_count == 1
        assert q["explanation"] is not None


def test_reject_short_lesson_text(client):
    """
    Test 2: Reject lesson text under 50 characters with a clear error.
    """
    payload = {
        "title": "Too Short Lesson",
        "lesson_text": "Plants need light.",  # Only 18 characters
        "age": 9
    }
    response = client.post("/api/quizzes", json=payload)
    assert response.status_code in (400, 422)
    err = response.json()
    detail = str(err.get("detail", err.get("errors", "")))
    assert "at least 50" in detail or "too short" in detail.lower()


def test_reject_long_lesson_text(client):
    """
    Test 3: Reject lesson text over 5,000 characters with a clear error.
    """
    payload = {
        "title": "Too Long Lesson",
        "lesson_text": "This is a super long sentence that will be repeated over and over. " * 80,  # > 5000 chars
        "age": 12
    }
    response = client.post("/api/quizzes", json=payload)
    assert response.status_code in (400, 422)
    err = response.json()
    detail = str(err.get("detail", err.get("errors", "")))
    assert "5,000" in detail or "5000" in detail or "too long" in detail.lower()


def test_reject_invalid_age(client):
    """
    Test 4: Reject age outside the 8-14 range.
    """
    # Too young (< 8)
    res_young = client.post("/api/quizzes", json={"title": "Test", "lesson_text": VALID_LESSON, "age": 5})
    assert res_young.status_code in (400, 422)

    # Too old (> 14)
    res_old = client.post("/api/quizzes", json={"title": "Test", "lesson_text": VALID_LESSON, "age": 17})
    assert res_old.status_code in (400, 422)


def test_list_quizzes_pagination_and_ordering(client):
    """
    Test 5: List quizzes with pagination, ordered newest first.
    """
    # Create 3 quizzes
    for i in range(1, 4):
        client.post("/api/quizzes", json={
            "title": f"Lesson Number {i}",
            "lesson_text": VALID_LESSON,
            "age": 8 + i
        })

    # Page 1 with size 2
    response = client.get("/api/quizzes?page=1&size=2")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["pages"] == 2
    # Newest first: Quiz 3 then Quiz 2
    assert data["items"][0]["title"] == "Lesson Number 3"
    assert data["items"][1]["title"] == "Lesson Number 2"

    # Page 2 with size 2
    response_p2 = client.get("/api/quizzes?page=2&size=2")
    assert response_p2.status_code == 200
    data_p2 = response_p2.json()
    assert len(data_p2["items"]) == 1
    assert data_p2["items"][0]["title"] == "Lesson Number 1"


def test_get_quiz_by_id(client):
    """
    Test 6: Get one quiz with questions, options, and correct answers.
    """
    create_res = client.post("/api/quizzes", json={
        "title": "Solar System Exploration",
        "lesson_text": VALID_LESSON,
        "age": 11
    })
    created = create_res.json()
    quiz_id = created["id"]

    get_res = client.get(f"/api/quizzes/{quiz_id}")
    assert get_res.status_code == 200
    quiz_data = get_res.json()
    assert quiz_data["id"] == quiz_id
    assert quiz_data["title"] == "Solar System Exploration"
    assert len(quiz_data["questions"]) == 5
    assert len(quiz_data["questions"][0]["options"]) == 4


def test_get_nonexistent_quiz_returns_404(client):
    """
    Test 7: Attempting to fetch an invalid ID returns 404.
    """
    res = client.get("/api/quizzes/999999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()
