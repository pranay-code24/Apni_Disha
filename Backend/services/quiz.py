"""
Terminal RIASEC adaptive chatbot using Google Gemini (gemini-2.0-flash) — NO LANGCHAIN.

✔ FIXED: No Modality error
✔ FIXED: Works with google-generativeai==0.5.2
✔ Same features: RIASEC scoring, MCQ generation, JSON recommendations
"""

import json
import random
import os
from dotenv import load_dotenv
import google.generativeai as genai
from pathlib import Path

load_dotenv()

# ---------------- CONFIG ----------------
BASE_DIR = Path(__file__).resolve().parent   # folder of quiz.py
QUESTIONS_FILE = BASE_DIR / "questions.json"
NUM_QUESTIONS_TO_ASK = 6
NUM_LLM_GENERATED_QUESTIONS = 5
MODEL_NAME = "gemini-2.0-flash"
API_ENV_VAR = "GEMINI_API_KEY"
# ---------------------------------------

api_key = os.getenv(API_ENV_VAR)
if not api_key:
    raise EnvironmentError(f"Missing env variable {API_ENV_VAR}")

genai.configure(api_key=api_key)
model = genai.GenerativeModel(MODEL_NAME)

# ---------------- LOAD QUESTIONS ----------------
with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
    QUESTION_BANK = json.load(f)

TRAITS = ["R", "I", "A", "S", "E", "C"]
for t in TRAITS:
    if t not in QUESTION_BANK:
        raise ValueError(f"Trait {t} missing in JSON file.")

SCORE_MAP = {1: 0.0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1.0}

raw_scores = {t: 0.0 for t in TRAITS}
questions_asked = {t: [] for t in TRAITS}
qa_history = []


# ---------------- CORE LOGIC ----------------

def call_gemini(prompt: str) -> str:
    """Helper to call Gemini and return ONLY plaintext."""
    response = model.generate_content(prompt)
    return getattr(response, "text", str(response))


def pick_next_question():
    """Adaptive question: pick trait with fewest asked."""
    counts = {t: len(questions_asked[t]) for t in TRAITS}
    min_count = min(counts.values())
    candidate_traits = [t for t, c in counts.items() if c == min_count]

    chosen_trait = random.choice(candidate_traits)

    available = [
        q for q in QUESTION_BANK[chosen_trait]
        if q not in questions_asked[chosen_trait]
    ]
    if not available:
        available = QUESTION_BANK[chosen_trait][:]

    question = random.choice(available)
    return chosen_trait, question


def get_user_rating(prompt_text):
    while True:
        ans = input(prompt_text + " (1-5): ").strip()
        if ans.isdigit() and 1 <= int(ans) <= 5:
            return int(ans)
        print("Enter a number between 1 and 5.")


def normalize_scores():
    normalized = {}
    for t in TRAITS:
        n = len(questions_asked[t])
        if n == 0:
            normalized[t] = 0.5
        else:
            normalized[t] = round(raw_scores[t] / n, 4)
    return normalized


def build_recommendation_prompt(qa_history, normalized_scores):
    qa_lines = [
        f"{idx}. Trait={trait} | Q='{question}' | Rating={rating}"
        for idx, (trait, question, rating) in enumerate(qa_history, 1)
    ]

    qa_block = "\n".join(qa_lines)

    return """
You are an expert career counselor.

Based on the user's answers below, recommend 2–3 career options.

IMPORTANT OUTPUT RULES:
- Return ONLY valid JSON
- NO markdown
- NO explanations outside JSON
- Follow the exact schema below

OUTPUT SCHEMA:
{
  "recommendations": [
    {
      "career": "<career name>",
      "reason": "<short reason (1–2 sentences) tied to the user's RIASEC strengths>",
      "stream": "<science | commerce | arts>",
      "degrees": [
        {
          "degree": "<general degree name>",
          "specializations": ["<specialization 1>", "<specialization 2>", "<specialization 3>"]
        }
      ]
    }
  ]
}

DEGREE STRUCTURE RULES:
- Each career MUST include 2–3 general degree options
- Each degree MUST include 2–4 realistic general specializations
- Degrees and specializations must be real and commonly offered in India

EXAMPLE (DO NOT COPY, ONLY FOLLOW STRUCTURE):

{
  "career": "Software Developer",
  "reason": "Strong Investigative and Realistic traits indicate logical thinking and a preference for problem-solving tasks.",
  "stream": "science",
  "degrees": [
    {
      "degree": "B.Tech",
      "specializations": ["Computer Science", "Information Technology", "Artificial Intelligence & Machine Learning"]
    },
    {
      "degree": "B.Sc",
      "specializations": ["Computer Science", "Data Science", "Information Technology"]
    },
    {
      "degree": "BCA",
      "specializations": ["Software Development", "Mobile Application Development", "Cloud Computing"]
    }
  ]
}

Now analyze the user data below and generate recommendations using the same structure.

User Q&A (ordered):
{qa_history}

Final normalized RIASEC scores (each between 0 and 1):
{normalized_scores}

Generate 2–3 career recommendations that best match the user's profile.
"""


def ask_llm_for_recommendations(qa_history, normalized_scores):
    prompt = build_recommendation_prompt(qa_history, normalized_scores)
    text = call_gemini(prompt).strip()

    # Try direct JSON parse
    try:
        return json.loads(text), text
    except:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(text[start:end + 1]), text
            except:
                return None, text
    return None, text


def generate_llm_mcq_questions(qa_history, num_questions=NUM_LLM_GENERATED_QUESTIONS):
    qa_lines = [
        f"{idx}. Trait={trait} | Q='{question}' | Rating={rating}"
        for idx, (trait, question, rating) in enumerate(qa_history, 1)
    ]
    qa_block = "\n".join(qa_lines)

    prompt = f"""
You are an expert in psychometric assessments.
Generate EXACTLY {num_questions} MCQs to refine career prediction.

RULES:
- 4 options: A, B, C, D
- JSON ONLY in format:

{{
  "questions": [
    {{
      "question": "text",
      "options": {{
        "A": "text",
        "B": "text",
        "C": "text",
        "D": "text"
      }}
    }}
  ]
}}

User Q&A history:
{qa_block}

Return ONLY JSON.
"""

    text = call_gemini(prompt).strip()

    try:
        return json.loads(text).get("questions", [])
    except:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(text[start:end+1]).get("questions", [])
            except:
                pass
    print("Failed to parse MCQ JSON:\n", text)
    return []


def run_mcq_stage(mcq_list):
    print("\n=== MCQ Stage ===")
    for i, q in enumerate(mcq_list, 1):
        print(f"\nMCQ {i}: {q['question']}")
        for key, val in q["options"].items():
            print(f" {key}. {val}")

        while True:
            choice = input("Your answer (A/B/C/D): ").upper().strip()
            if choice in ["A", "B", "C", "D"]:
                break
            print("Invalid. Choose A/B/C/D.")

        qa_history.append(("MCQ", q["question"], choice))


# ---------------- MAIN ----------------

def main():
    print("=== Adaptive RIASEC Test ===")
    print("Rate each question from 1 (low) to 5 (high).")
    input("Press Enter to start...")

    for i in range(NUM_QUESTIONS_TO_ASK):
        trait, question = pick_next_question()
        print(f"\nQ{i+1}: ({trait}) {question}")
        rating = get_user_rating("Your rating")

        raw_scores[trait] += SCORE_MAP[rating]
        questions_asked[trait].append(question)
        qa_history.append((trait, question, rating))

    print("\n--- RIASEC Stage Complete ---")

    mcqs = generate_llm_mcq_questions(qa_history)
    if mcqs:
        run_mcq_stage(mcqs)

    normalized = normalize_scores()

    print("\nNormalized RIASEC Scores:")
    for t, v in normalized.items():
        print(f" {t}: {v}")

    result_json, raw = ask_llm_for_recommendations(qa_history, normalized)

    print("\nLLM RAW OUTPUT:\n", raw)
    print("\nPARSED JSON:\n", json.dumps(result_json, indent=2) if result_json else "FAILED TO PARSE JSON")

    print("\nDone.")


if __name__ == "__main__":
    main()
