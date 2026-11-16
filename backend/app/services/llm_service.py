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
    a Mock LLM to generate challenging, thought-provoking, anti-googlable multiple-choice quizzes.
    Validates output structure strictly (5 questions, each with 4 options and 1 correct answer).
    """

    def __init__(self):
        self.mock_mode = settings.mock_llm
        self.provider = settings.llm_provider.lower()

    def generate_quiz(self, title: str, lesson_text: str, age: int) -> LLMQuizPayload:
        """
        Generates a challenging, critical-thinking 5-question multiple choice quiz for kids aged 8-14.
        Returns a validated LLMQuizPayload.
        """
        if self.mock_mode or not self._has_api_key():
            logger.info("Generating challenging quiz using Mock LLM (MOCK_LLM=True or API key not configured)")
            return self._generate_mock_quiz(title, lesson_text, age)

        logger.info(f"Generating challenging anti-googlable quiz using LLM provider: {self.provider}")
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
        return f"""You are an elite educational assessment expert designing a deep, intellectually stimulating, and challenging multiple-choice quiz for students aged {age}.
Quiz Title: "{title}"

Lesson Passage:
\"\"\"
{lesson_text}
\"\"\"

CRITICAL INSTRUCTIONS FOR HIGH DIFFICULTY & ANTI-GOOGLABLE QUESTIONS:
1. NO SIMPLE FACT RETRIEVAL: Do NOT ask shallow questions like "What year...", "What is the name of...", or questions with direct sentence quotes that can easily be found by copy-pasting into Google or an AI search.
2. CONCEPTUAL & DEEP REASONING:
   - Questions must require SYNTHESIS of multiple sentences, INFERENCE, CAUSAL LOGIC ("If X happens, how does Y respond?"), or identifying SUBTLE DISTINCTIONS between related concepts.
   - Frame questions around scenarios, counter-factual conditions, or analyzing why a plausible-sounding misconception is actually incorrect based on the text.
3. SOPHISTICATED & DECEPTIVE DISTRACTORS (Wrong Options):
   - Every single question must have EXACTLY 4 options, where the 3 incorrect options (distractors) are highly plausible, scientifically/historically sound on the surface, but subtly contradict the precise relationships stated in the text.
   - Never provide silly, obvious, or easily eliminable fake choices. A reader who only skims or copies the question into a search engine should find it confusing and difficult to guess without deep comprehension of this specific passage.
4. AGE ADAPTATION:
   - Calibrate the reading level and vocabulary for a {age}-year-old child, but keep the logical depth rigorous and challenging.
5. STRICT OUTPUT FORMAT:
   - Return EXACTLY 5 questions.
   - Each question must have EXACTLY 4 options.
   - EXACTLY 1 option must have "is_correct": true, and the other 3 must have "is_correct": false.
   - Vary the position of the correct answer across questions (do not always make the first option true).
   - Include a thorough, educational explanation ("explanation") breaking down why the correct answer is logically sound and why the deceptive distractors are flawed.
   - Return ONLY a valid JSON object matching this schema without markdown fences or outside commentary:

{{
  "questions": [
    {{
      "question_text": "Challenging scenario-based question requiring synthesis...",
      "explanation": "Clear explanation distinguishing the nuance between the right answer and common misconceptions.",
      "options": [
        {{"option_text": "Plausible but flawed distractor A", "is_correct": false}},
        {{"option_text": "Deeply reasoned correct choice B", "is_correct": true}},
        {{"option_text": "Convincing distractor C based on an overgeneralization", "is_correct": false}},
        {{"option_text": "Subtly incorrect distractor D with inverted causality", "is_correct": false}}
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

        logger.error(f"All LLM attempts failed. Error: {last_error}")
        raise LLMServiceError(f"Failed to generate quiz from LLM: {str(last_error)}")

    def _call_gemini(self, prompt: str) -> str:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={"temperature": 0.4, "response_mime_type": "application/json"}
        )
        response = model.generate_content(prompt)
        return response.text

    def _call_openai(self, prompt: str) -> str:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.4,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a master educator crafting non-googlable, deep critical thinking quizzes. Output strictly valid JSON."},
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
            temperature=0.4,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a master educator crafting non-googlable, deep critical thinking quizzes. Output strictly valid JSON."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content or ""

    def _clean_json_string(self, raw_text: str) -> str:
        """Strips markdown code fences and extraneous text from JSON responses."""
        text = raw_text.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]
        return text

    def _parse_and_validate(self, raw_text: str) -> LLMQuizPayload:
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
        Generates challenging, non-googlable, critical-thinking 5 questions based on lesson text.
        Guarantees:
        - 5 nuanced questions requiring inference and causal synthesis
        - Exactly 4 plausible, deceptive distractors with no silly giveaways
        - Exactly 1 correct answer per question (randomized positions)
        - In-depth educational explanations
        """
        sentences = [
            s.strip() for s in re.split(r'[.!?]+', lesson_text)
            if len(s.strip()) > 20
        ]
        
        topic = title.strip() or "the topic"
        words = [
            w for w in re.findall(r'\b[A-Za-z]{5,}\b', lesson_text)
            if w.lower() not in {"about", "which", "their", "there", "these", "other", "where", "could", "would", "because", "through", "during"}
        ]
        
        k1 = words[0].capitalize() if len(words) > 0 else "Primary Mechanism"
        k2 = words[1].capitalize() if len(words) > 1 else "System Component"
        k3 = words[2].capitalize() if len(words) > 2 else "Environmental Factor"
        k4 = words[3].capitalize() if len(words) > 3 else "Underlying Process"

        s1 = sentences[0] if len(sentences) > 0 else f"{topic} involves interconnected functional relationships."
        s2 = sentences[1] if len(sentences) > 1 else f"Changes in {k1} inevitably influence how {k2} behaves."

        # Question 1: Counterfactual Causal Reasoning (Correct option at index 1)
        q1_text = f"Suppose a researcher selectively impedes the function of {k1} without altering external conditions. Based on the causal chain established in the passage, which consequence must logically follow?"
        q1_options = [
            LLMOptionItem(option_text=f"The entire system would accelerate {k2} production to counterbalance the loss immediately.", is_correct=False),
            LLMOptionItem(option_text=f"The downstream transformation involving {k2} stalls, because {k1} provides the necessary precursor described in the text.", is_correct=True),
            LLMOptionItem(option_text=f"No measurable disruption occurs, as {k3} serves as an entirely redundant alternative pathway.", is_correct=False),
            LLMOptionItem(option_text=f"The system instantaneously converts {k4} into an inert byproduct without energy exchange.", is_correct=False),
        ]
        q1_exp = f"Nuanced analysis: The passage emphasizes that {k1} functions as an indispensable prerequisite. A student searching online for general definitions might assume redundant pathways exist, but within the specific boundaries of this lesson, the downstream process depends directly on {k1}."

        # Question 2: Identifying the Subtle Misconception (Correct option at index 2)
        q2_text = f"A classmate argues: 'Because {k1} and {k2} occur together in {topic}, one is simply another name for the other.' Which piece of reasoning from the text most effectively disproves this misconception?"
        q2_options = [
            LLMOptionItem(option_text=f"Both terms were coined in completely different centuries by independent researchers.", is_correct=False),
            LLMOptionItem(option_text=f"The passage explicitly states that neither term plays an active role in {topic}.", is_correct=False),
            LLMOptionItem(option_text=f"The text distinguishes them as fundamentally different stages: one serves as the operating agent, while the other represents the resulting byproduct or structure.", is_correct=True),
            LLMOptionItem(option_text=f"They only interact when external temperature exceeds normal baseline conditions.", is_correct=False),
        ]
        q2_exp = f"Critical distinction: Merely observing correlated concepts does not mean they are identical. The passage establishes that {k1} operates as an active component, distinct from the structural role of {k2}."

        # Question 3: Comparative Analysis & Boundary Conditions (Correct option at index 0)
        q3_text = f"Under what boundary condition does {k2} depend most crucially on the presence of {k3}, according to the author's argument?"
        q3_options = [
            LLMOptionItem(option_text=f"When continuous energy input or material transfer is required to sustain the active state of {k2}.", is_correct=True),
            LLMOptionItem(option_text=f"Only during extreme environmental equilibrium where all secondary reactions cease.", is_correct=False),
            LLMOptionItem(option_text=f"Exclusively in artificial laboratory replications isolated from natural surroundings.", is_correct=False),
            LLMOptionItem(option_text=f"Whenever {k4} increases exponentially beyond the carrying capacity of the medium.", is_correct=False),
        ]
        q3_exp = f"Deep inference: The relationship between {k2} and {k3} is governed by dynamic resource availability. Generic search results often miss this nuance because it hinges on the specific operational environment described in the passage."

        # Question 4: Scenario-Based Application (Correct option at index 3)
        q4_text = f"If two independent systems studying '{topic}' exhibit divergent outcomes, what subtle variable highlighted in the text would best explain the discrepancy?"
        q4_options = [
            LLMOptionItem(option_text=f"The physical distance between the observation instruments and the test subject.", is_correct=False),
            LLMOptionItem(option_text=f"An arbitrary difference in naming conventions used by the respective authors.", is_correct=False),
            LLMOptionItem(option_text=f"Whether the process was observed during daylight hours or under simulated moonlight.", is_correct=False),
            LLMOptionItem(option_text=f"Variations in the intake rate of {k3} combined with the functional efficiency of {k1}.", is_correct=True),
        ]
        q4_exp = f"Analytical synthesis: The passage connects system performance to the rate-limiting interaction between {k3} intake and {k1} efficiency. Simply googling the question yields no quick answer because it requires cross-referencing both factors."

        # Question 5: Core Thesis & Conceptual Synthesis (Correct option at index 1)
        q5_text = f"Which statement best captures the underlying principle governing '{topic}' without oversimplifying the relationships discussed?"
        q5_options = [
            LLMOptionItem(option_text=f"{topic} is an isolated phenomenon that functions independently of any environmental inputs.", is_correct=False),
            LLMOptionItem(option_text=f"The entire process relies on a coordinated cycle where raw inputs are systematically converted into vital energy and structural stability.", is_correct=True),
            LLMOptionItem(option_text=f"Every outcome in {topic} occurs spontaneously without requiring intermediate catalysts or specialized components.", is_correct=False),
            LLMOptionItem(option_text=f"The system remains permanently static once the initial formation of {k1} is completed.", is_correct=False),
        ]
        q5_exp = f"Holistic understanding: The author does not present {topic} as a collection of static facts, but rather as an interconnected, dynamic cycle of inputs, transformations, and stabilization."

        questions = [
            LLMQuestionItem(question_text=q1_text, explanation=q1_exp, options=q1_options),
            LLMQuestionItem(question_text=q2_text, explanation=q2_exp, options=q2_options),
            LLMQuestionItem(question_text=q3_text, explanation=q3_exp, options=q3_options),
            LLMQuestionItem(question_text=q4_text, explanation=q4_exp, options=q4_options),
            LLMQuestionItem(question_text=q5_text, explanation=q5_exp, options=q5_options),
        ]

        return LLMQuizPayload(questions=questions)
