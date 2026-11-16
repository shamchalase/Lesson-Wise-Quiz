# 🎓 Lesson Quiz Generator (for Kids Aged 8–14)

A full-stack web application designed for educators and teachers. Paste any lesson passage or educational text, and the app uses an LLM to generate an engaging, age-appropriate **5-question multiple-choice quiz** (with exactly 4 options and 1 correct answer per question), saves it to a persistent database, and provides an interactive quiz session with instant scoring, celebratory feedback, and educational explanations.

---

## 🌟 Key Features

- **Age-Appropriate AI Quiz Generation**: Tailored vocabulary, phrasing, and difficulty for children aged **8 to 14 years old**.
- **Strict Question Schema**: Guarantees **exactly 5 questions**, **exactly 4 options per question**, and **exactly 1 correct answer**, validated against a Pydantic schema with automated retries.
- **Input Validation**: Automatically rejects lesson text under 50 characters or over 5,000 characters with descriptive error messages.
- **Multi-LLM Support with Zero-Config Mock Mode**:
  - Out of the box, `MOCK_LLM=true` generates contextual, high-quality quizzes without requiring any API keys.
  - Supports **Google Gemini** (`gemini-1.5-flash`), **OpenAI** (`gpt-4o-mini`), and **Groq** (`llama-3.3-70b-versatile`).
- **Interactive Quiz Player**:
  - Question-by-question progress bar and question navigation jump dots.
  - Option selection with A/B/C/D badges.
  - Instant scoring with personalized badges (e.g. *Quiz Star 🌟*, *Perfect Score 🏆*).
  - Confetti celebration upon completion!
  - In-depth question breakdown displaying what the student selected vs. the correct answer, along with educational explanations.
- **Saved Quizzes with Pagination**:
  - `GET /api/quizzes?page=1&size=10` sorted newest first.
  - Card-based UI showing target age, creation timestamp, and question count.
- **Double Submission Prevention & Progress States**:
  - UI disables generation while in-flight and displays helpful step-by-step progress feedback.

---

## 🏗️ Architecture & Folder Structure

```text
Lessons-wise-quiz/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, CORS, lifespan & error handlers
│   │   ├── config.py            # Pydantic Settings & environment variables
│   │   ├── database.py          # SQLAlchemy engine, session maker & Base
│   │   ├── models.py            # ORM models: Quiz, Question, Option
│   │   ├── schemas.py           # Pydantic schemas for API requests & LLM validation
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── llm_service.py   # LLM orchestration (Gemini, OpenAI, Groq, Mock)
│   │   └── routers/
│   │       ├── __init__.py
│   │       └── quizzes.py       # REST API endpoints (POST, GET, DELETE)
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_quizzes.py      # Comprehensive pytest test suite (7 tests)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Header navigation & quiz counter
│   │   │   ├── QuizForm.jsx     # Lesson submission form with live validation
│   │   │   ├── QuizList.jsx     # Paginated list of saved quizzes
│   │   │   └── QuizPlayer.jsx   # Interactive quiz player with review & score
│   │   ├── services/
│   │   │   └── api.js           # API client with clean error mapping
│   │   ├── store/
│   │   │   ├── index.js         # Redux Toolkit store configuration
│   │   │   └── quizSlice.js     # Redux slice with async thunks & player state
│   │   ├── App.jsx              # Main container
│   │   ├── main.jsx             # React entry point with Redux Provider
│   │   └── index.css            # Tailwind directives & custom animations
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── nginx.conf               # Nginx reverse proxy configuration for Docker
│   └── Dockerfile
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI for backend tests & frontend build
├── docker-compose.yml           # Multi-container Docker configuration
├── .env.example                 # Root environment template
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide

### Option 1: Run Locally (Recommended for Development)

#### 1. Backend Setup (FastAPI)
```bash
# Navigate to the backend directory
cd backend

# Create a Python virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
.\venv\Scripts\activate
# On Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables (Mock mode enabled by default)
cp .env.example .env

# Run backend development server
uvicorn app.main:app --reload --port 8000
```
The FastAPI backend will start at `http://localhost:8000`.  
- Interactive API Swagger Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

#### 2. Frontend Setup (React + Vite + Redux)
Open a second terminal window:
```bash
# Navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```
The frontend will start at `http://localhost:3000` (or `http://localhost:5173`), with requests to `/api` automatically proxied to the backend.

---

### Option 2: Run with Docker Compose

Ensure Docker and Docker Compose are installed, then run:

```bash
docker compose up --build
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **Swagger Docs**: `http://localhost:8000/docs`

---

## 🧪 Running Backend Tests (pytest)

The backend includes a comprehensive automated test suite testing validation, database persistence, pagination, error responses, and mock generation:

```bash
# From the repository root with virtual environment activated:
pytest backend/tests -v
```

### Test Cases Covered:
1. `test_create_quiz_success`: Validates successful 5-question generation, each having 4 options and 1 correct answer.
2. `test_reject_short_lesson_text`: Verifies lesson text < 50 characters is rejected with HTTP 400 and clear error message.
3. `test_reject_long_lesson_text`: Verifies lesson text > 5,000 characters is rejected with HTTP 400.
4. `test_reject_invalid_age`: Verifies ages outside 8–14 are rejected.
5. `test_list_quizzes_pagination_and_ordering`: Tests `page=1&size=2` pagination and verifies newest-first sorting.
6. `test_get_quiz_by_id`: Verifies retrieving quiz by ID returns all questions, options, and correct answers.
7. `test_get_nonexistent_quiz_returns_404`: Verifies querying invalid quiz IDs returns HTTP 404 Not Found.

---

## 🔌 API Reference

### `POST /api/quizzes`
Generates and saves a new quiz.
- **Request Body**:
  ```json
  {
    "title": "Photosynthesis",
    "lesson_text": "Photosynthesis is the process green plants use to convert sunlight...",
    "age": 10
  }
  ```
- **Response**: `201 Created` with full quiz payload (id, title, age, questions, options, correct answers).
- **Validation**:
  - `title`: 1–200 characters.
  - `lesson_text`: 50–5,000 characters.
  - `age`: integer between 8 and 14.

### `GET /api/quizzes?page=1&size=10`
Returns a paginated list of quizzes sorted newest first.
- **Response**: `200 OK`
  ```json
  {
    "items": [
      {
        "id": 1,
        "title": "Photosynthesis",
        "age": 10,
        "created_at": "2026-11-16T21:25:00Z",
        "question_count": 5
      }
    ],
    "total": 1,
    "page": 1,
    "size": 10,
    "pages": 1
  }
  ```

### `GET /api/quizzes/{id}`
Returns a single quiz with its 5 questions, options, and correct answers.
- **Response**: `200 OK` (or `404 Not Found`).

### `DELETE /api/quizzes/{id}`
Deletes a quiz and cascades removal of all associated questions and options.
- **Response**: `204 No Content`.

---

## 💡 Design Decisions

1. **FastAPI & Pydantic v2**:
   - High performance, automatic OpenAPI documentation, and strict request/response data validation.
   - Pydantic models validate both incoming client payloads and raw LLM JSON outputs, catching malformed LLM responses before database persistence.

2. **SQLite with SQLAlchemy ORM**:
   - Zero-configuration, file-based persistence for seamless setup without needing external database servers.
   - Designed with relational foreign key cascading (`quizzes -> questions -> options`) and indexes on foreign keys and creation dates.
   - Easy swap to PostgreSQL in production simply by updating `DATABASE_URL`.

3. **Multi-LLM Strategy & Resilient Fallback**:
   - Supports Google Gemini, OpenAI, and Groq via modular methods in `LLMService`.
   - Out-of-the-box `MOCK_LLM=true` generates dynamic, contextual 5-question quizzes derived from the submitted text so reviewers can test immediately without providing credit cards or API keys.
   - Includes markdown fence stripping and structured JSON parsing error handling.

4. **Redux Toolkit for Frontend State Management**:
   - Centralized state for quiz generation, saved quiz list, active quiz session, and interactive player answers.
   - Prevents double submission by checking `isGenerating` state on both the UI button and Redux thunk.
   - Decoupled question player state allows students to answer, review, jump between questions, and retake the quiz cleanly.

5. **Kid-Friendly, Accessible UX**:
   - Clear visual character counters (green when within 50–5,000 chars, warning when outside).
   - Preset lesson buttons ("Photosynthesis", "Solar System", "Ancient Egypt") for rapid 1-click evaluation.
   - Celebratory feedback and explanations helping kids understand *why* an answer is correct.

---

## 🔮 What I Would Improve With More Time

1. **User Authentication & Multi-Tenancy**:
   - Teacher accounts (JWT / OAuth2) to keep quiz collections organized by class or subject.
2. **Streaming LLM Generation**:
   - Stream generated questions via Server-Sent Events (SSE) so users see questions pop up in real-time as the LLM writes them.
3. **Export Formats**:
   - Export quizzes to PDF printable worksheets (with answer key on a separate page) or Google Forms / Kahoot format.
4. **Text-to-Speech (TTS) & Accessibility**:
   - Add Web Speech API narration so younger children (ages 8–9) or auditory learners can listen to questions and choices read aloud.
5. **Classroom Performance Analytics**:
   - Aggregate statistics showing which questions students struggled with most, highlighting topics needing review.

---

## 🤖 Where AI Tools Were Used

In accordance with the task instructions:
- **Prompt Engineering & Schema Definition**: AI was used to draft the system prompt and JSON schema constraints ensuring LLMs consistently produce exactly 4 choices with exactly 1 true answer and kid-friendly explanations.
- **Test Scenarios**: AI helped structure the boundary test cases for character limits (49 chars vs 50 chars, 5000 chars vs 5001 chars) and age validation (7 vs 8, 14 vs 15).
- **UI Design Inspiration**: AI assisted in crafting modern, child-friendly Tailwind color palettes, icon alignments, and interactive state progressions.

