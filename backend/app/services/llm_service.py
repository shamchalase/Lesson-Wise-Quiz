import json
import logging
import re
from typing import Optional, Dict, Any, List
from app.config import settings
from app.schemas import LLMQuizPayload, LLMQuestionItem, LLMOptionItem

logger = logging.getLogger(__name__)


class LLMServiceError(Exception):
    """Custom exception raised when LLM generation or validation fails."""
    pass


class LLMService:
    """
    Service responsible for prompting an LLM (Gemini, OpenAI, Groq) or using
    a Mock LLM to generate age-appropriate multiple-choice quizzes.
    Validates output structure strictly (5 questions, each with 4 options and 1 correct answer).
    """

    def __init__(self):
        self.mock_mode = settings.mock_llm
        self.provider = settings.llm_provider.lower()

    def generate_quiz(self, title: str, lesson_text: str, age: int) -> LLMQuizPayload:
        """
        Generates a 5-question multiple choice quiz for kids aged 8-14.
        Returns a validated LLMQuizPayload.
        """
        # If mock mode is explicitly enabled or required keys are missing, use mock generator
        if self.mock_mode or not self._has_api_key():
            logger.info("Generating quiz using Mock LLM (MOCK_LLM=True or API key not configured)")
            return self._generate_mock_quiz(title, lesson_text, age)

        logger.info(f"Generating quiz using LLM provider: {self.provider}")
        raw_text = self._call_llm_with_retry(title, lesson_text, age)
        return self._parse_and_validate(raw_text)

    def _has_api_key(self) -> bool:
        if self.provider == "gemini" and settings.gemini_api_key:
            return True
        if self.provider == "openai" and settings.openai_api_key:
            return True
        if self.provider == "groq" and settings.groq_api_key:
            return True
        return False

    def _build_prompt(self, title: str, lesson_text: str, age: int) -> str:
        return f"""You are an expert children's educator creating a fun, engaging, and clear multiple-choice quiz.
Target Audience: Kids aged {age} years old.
Quiz Title: "{title}"

Lesson Content:
\"\"\"
{lesson_text}
\"\"\"

Requirements:
1. Create EXACTLY 5 multiple-choice questions testing reading comprehension and understanding of the lesson.
2. The language, vocabulary, and tone MUST be appropriate for a {age}-year-old child.
3. Each question MUST have EXACTLY 4 plausible options (never more, never less).
4. EXACTLY 1 option must be marked as correct (is_correct: true), and the other 3 must be false (is_correct: false).
5. Include a brief, friendly, educational explanation for why the correct answer is right.
6. Return ONLY a valid JSON object matching this schema without any markdown formatting or commentary:

{{
  "questions": [
    {{
      "question_text": "What is the main topic of the lesson?",
      "explanation": "Great job! The text explains that...",
      "options": [
        {{"option_text": "Choice A", "is_correct": true}},
        {{"option_text": "Choice B", "is_correct": false}},
        {{"option_text": "Choice C", "is_correct": false}},
        {{"option_text": "Choice D", "is_correct": false}}
      ]
    }}
  ]
}}
"""

    def _call_llm_with_retry(self, title: str, lesson_text: str, age: int, max_retries: int = 2) -> str:
        prompt = self._build_prompt(title, lesson_text, age)
        last_error = None

        for attempt in range(1, max_retries + 1):
            try:
                if self.provider == "gemini":
                    return self._call_gemini(prompt)
                elif self.provider == "openai":
                    return self._call_openai(prompt)
                elif self.provider == "groq":
                    return self._call_groq(prompt)
                else:
                    raise LLMServiceError(f"Unsupported LLM provider: {self.provider}")
            except Exception as e:
                last_error = e
                logger.warning(f"LLM call attempt {attempt}/{max_retries} failed: {e}")

        # If LLM calls fail repeatedly, fallback gracefully to mock or raise clear error
        logger.error(f"All LLM attempts failed. Error: {last_error}")
        raise LLMServiceError(f"Failed to generate quiz from LLM: {str(last_error)}")

    def _call_gemini(self, prompt: str) -> str:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        
        # Prefer gemini-1.5-flash or gemini-pro
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={"temperature": 0.3, "response_mime_type": "application/json"}
        )
        response = model.generate_content(prompt)
        return response.text

    def _call_openai(self, prompt: str) -> str:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are an educator for children aged 8-14. Output strictly valid JSON."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content or ""

    def _call_groq(self, prompt: str) -> str:
        from openai import OpenAI
        client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=settings.groq_api_key
        )
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are an educator for children aged 8-14. Output strictly valid JSON."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content or ""

    def _clean_json_string(self, raw_text: str) -> str:
        """Strips markdown code fences and extraneous text from JSON responses."""
        text = raw_text.strip()
        # Remove ```json ... ``` or ``` ... ```
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        
        # Regex search for first { and last }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]
        return text

    def _parse_and_validate(self, raw_text: str) -> LLMQuizPayload:
        """Parses JSON and validates against Pydantic schema."""
        cleaned = self._clean_json_string(raw_text)
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM output as JSON: {cleaned[:200]}")
            raise LLMServiceError(f"LLM returned invalid JSON: {str(e)}")

        try:
            payload = LLMQuizPayload.model_validate(data)
            return payload
        except Exception as e:
            logger.error(f"LLM output failed schema validation: {e}")
            raise LLMServiceError(f"LLM output did not meet quiz requirements (5 questions, 4 options, 1 correct): {str(e)}")

    def _generate_mock_quiz(self, title: str, lesson_text: str, age: int) -> LLMQuizPayload:
        """
        Generates realistic, age-tailored 5 questions based on lesson text.
        Guarantees:
        - Exactly 5 questions
        - Exactly 4 options per question
        - Exactly 1 correct answer per question
        - Kid-friendly explanations
        """
        # Split text into meaningful sentences
        sentences = [
            s.strip() for s in re.split(r'[.!?]+', lesson_text)
            if len(s.strip()) > 15
        ]
        
        topic = title.strip() or "the lesson"
        words = [w for w in re.findall(r'\b[A-Za-z]{4,}\b', lesson_text) if w.lower() not in {"this", "that", "with", "from", "they", "have", "were", "their"}]
        key_term = words[0].capitalize() if words else "Lesson Concept"
        second_term = words[1].capitalize() if len(words) > 1 else "Key Idea"

        # 5 curated questions derived from lesson context
        q1_text = f"What is the main subject discussed in '{topic}'?"
        q1_options = [
            LLMOptionItem(option_text=f"The importance and details of {topic}", is_correct=True),
            LLMOptionItem(option_text=f"How to build an airplane from scratch", is_correct=False),
            LLMOptionItem(option_text=f"The recipe for chocolate chip cookies", is_correct=False),
            LLMOptionItem(option_text=f"Deep ocean marine biology in Antarctica", is_correct=False),
        ]
        q1_exp = f"Correct! The entire lesson is centered around exploring {topic}."

        s_sample = sentences[0] if sentences else f"{topic} teaches us something important."
        q2_text = f"According to the text, which of these statements is TRUE?"
        q2_options = [
            LLMOptionItem(option_text=f"It mentions: \"{s_sample[:60]}...\"", is_correct=True),
            LLMOptionItem(option_text=f"Scientists proved this fact completely wrong in 1820.", is_correct=False),
            LLMOptionItem(option_text=f"This only happens on Mars during winter.", is_correct=False),
            LLMOptionItem(option_text=f"Nobody has ever studied this before today.", is_correct=False),
        ]
        q2_exp = "Awesome reading comprehension! This fact is directly mentioned in the lesson text."

        q3_text = f"Why is understanding {key_term} important for someone your age ({age})?"
        q3_options = [
            LLMOptionItem(option_text=f"It gives us a deeper understanding of how {topic} works in the world.", is_correct=True),
            LLMOptionItem(option_text=f"It is only useful if you want to become a pirate.", is_correct=False),
            LLMOptionItem(option_text=f"It isn't important and will be forgotten tomorrow.", is_correct=False),
            LLMOptionItem(option_text=f"It helps you win video games faster.", is_correct=False),
        ]
        q3_exp = f"Great thinking! Learning about {key_term} helps us connect concepts and understand our world."

        q4_text = f"Which key word from the lesson relates most closely to '{second_term}'?"
        q4_options = [
            LLMOptionItem(option_text=f"{key_term} and related processes", is_correct=True),
            LLMOptionItem(option_text=f"Submarines and scuba gear", is_correct=False),
            LLMOptionItem(option_text=f"Medieval knights and castles", is_correct=False),
            LLMOptionItem(option_text=f"Smartphone battery chargers", is_correct=False),
        ]
        q4_exp = f"Spot on! Both concepts are interconnected within the lesson."

        q5_text = f"What is a great takeaway or conclusion we can draw from this lesson on {topic}?"
        q5_options = [
            LLMOptionItem(option_text=f"Learning about {topic} helps us understand natural and scientific principles.", is_correct=True),
            LLMOptionItem(option_text=f"Everything in the text was made up as a fairy tale.", is_correct=False),
            LLMOptionItem(option_text=f"There are no more questions to ask about this subject.", is_correct=False),
            LLMOptionItem(option_text=f"Books will be replaced by robots next week.", is_correct=False),
        ]
        q5_exp = f"Excellent! Reflecting on the big picture is what great young scholars aged {age} do best!"

        questions = [
            LLMQuestionItem(question_text=q1_text, explanation=q1_exp, options=q1_options),
            LLMQuestionItem(question_text=q2_text, explanation=q2_exp, options=q2_options),
            LLMQuestionItem(question_text=q3_text, explanation=q3_exp, options=q3_options),
            LLMQuestionItem(question_text=q4_text, explanation=q4_exp, options=q4_options),
            LLMQuestionItem(question_text=q5_text, explanation=q5_exp, options=q5_options),
        ]

        return LLMQuizPayload(questions=questions)
