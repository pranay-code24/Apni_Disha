# Backend/routes/quiz.py

from flask import Blueprint, request, jsonify
import json
import random
import os
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

quiz_routes = Blueprint("quiz_routes", __name__)

# ---------------- CONFIG ----------------
BASE_DIR = Path(__file__).resolve().parent.parent  # Backend folder
QUESTIONS_FILE = BASE_DIR / "services" / "questions.json"
MODEL_NAME = "gemini-2.0-flash"
API_ENV_VAR = "GEMINI_API_KEY"

TRAITS = ["R", "I", "A", "S", "E", "C"]
SCORE_MAP = {1: 0.0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1.0}

# Initialize Gemini
api_key = os.getenv(API_ENV_VAR)
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(MODEL_NAME)
else:
    model = None

# Load questions
QUESTION_BANK = {}
if QUESTIONS_FILE.exists():
    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        QUESTION_BANK = json.load(f)


# ---------------- HELPER FUNCTIONS ----------------

def call_gemini(prompt: str) -> str:
    """Helper to call Gemini and return plaintext."""
    if not model:
        raise Exception("Gemini API key not configured")
    response = model.generate_content(prompt)
    return getattr(response, "text", str(response))


def normalize_scores(raw_scores, questions_asked):
    """Normalize raw scores based on questions asked per trait."""
    normalized = {}
    for t in TRAITS:
        n = questions_asked.get(t, 0)
        if n == 0:
            normalized[t] = 0.5
        else:
            normalized[t] = round(raw_scores.get(t, 0) / n, 4)
    return normalized


def build_recommendation_prompt(qa_history, normalized_scores):
    """Build the prompt for career recommendations."""
    qa_lines = [
        f"{idx}. Trait={item['trait']} | Q='{item['question']}' | Rating={item['rating']}"
        for idx, item in enumerate(qa_history, 1)
    ]
    qa_block = "\n".join(qa_lines)

    return f"""
You are an expert career counselor.

Based on the user's answers below, recommend 2–3 career options.

IMPORTANT OUTPUT RULES:
- Return ONLY valid JSON
- NO markdown
- NO explanations outside JSON
- Follow the exact schema below

OUTPUT SCHEMA:
{{
  "recommendations": [
    {{
      "career": "<career name>",
      "reason": "<short reason (1–2 sentences) tied to the user's RIASEC strengths>",
      "stream": "<science | commerce | arts>",
      "degrees": [
        {{
          "degree": "<general degree name>",
          "specializations": ["<specialization 1>", "<specialization 2>", "<specialization 3>"]
        }}
      ]
    }}
  ]
}}

DEGREE STRUCTURE RULES:
- Each career MUST include 2–3 general degree options
- Each degree MUST include 2–4 realistic general specializations
- Degrees and specializations must be real and commonly offered in India

EXAMPLE (DO NOT COPY, ONLY FOLLOW STRUCTURE):

{{
  "career": "Software Developer",
  "reason": "Strong Investigative and Realistic traits indicate logical thinking and a preference for problem-solving tasks.",
  "stream": "science",
  "degrees": [
    {{
      "degree": "B.Tech",
      "specializations": ["Computer Science", "Information Technology", "Artificial Intelligence & Machine Learning"]
    }},
    {{
      "degree": "B.Sc",
      "specializations": ["Computer Science", "Data Science", "Information Technology"]
    }},
    {{
      "degree": "BCA",
      "specializations": ["Software Development", "Mobile Application Development", "Cloud Computing"]
    }}
  ]
}}

Now analyze the user data below and generate recommendations using the same structure.

User Q&A (ordered):
{qa_block}

Final normalized RIASEC scores (each between 0 and 1):
{json.dumps(normalized_scores)}

Generate 2–3 career recommendations that best match the user's profile.
"""


# ---------------- ROUTES ----------------

# GET /api/quiz/questions - Get all RIASEC questions
@quiz_routes.route("/quiz/questions", methods=["GET"])
def get_questions():
    """Return all RIASEC questions organized by trait."""
    if not QUESTION_BANK:
        return jsonify({"success": False, "message": "Questions not loaded"}), 500

    return jsonify({
        "success": True,
        "questions": QUESTION_BANK,
        "traits": TRAITS
    }), 200


# POST /api/quiz/next-question - Get next adaptive question
@quiz_routes.route("/quiz/next-question", methods=["POST"])
def get_next_question():
    """
    Adaptive question selection - picks trait with fewest asked.
    Body: { "questions_asked": { "R": ["q1", "q2"], "I": [], ... } }
    """
    data = request.get_json() or {}
    questions_asked = data.get("questions_asked", {t: [] for t in TRAITS})

    # Find trait with fewest questions asked
    counts = {t: len(questions_asked.get(t, [])) for t in TRAITS}
    min_count = min(counts.values())
    candidate_traits = [t for t, c in counts.items() if c == min_count]

    chosen_trait = random.choice(candidate_traits)

    # Get available questions for this trait
    asked = questions_asked.get(chosen_trait, [])
    available = [q for q in QUESTION_BANK.get(chosen_trait, []) if q not in asked]

    if not available:
        available = QUESTION_BANK.get(chosen_trait, [])[:]

    if not available:
        return jsonify({"success": False, "message": "No questions available"}), 400

    question = random.choice(available)

    return jsonify({
        "success": True,
        "trait": chosen_trait,
        "question": question
    }), 200


# POST /api/quiz/calculate-scores - Calculate normalized RIASEC scores
@quiz_routes.route("/quiz/calculate-scores", methods=["POST"])
def calculate_scores():
    """
    Calculate normalized RIASEC scores from user answers.
    Body: {
        "answers": [
            { "trait": "R", "question": "...", "rating": 4 },
            ...
        ]
    }
    """
    data = request.get_json() or {}
    answers = data.get("answers", [])

    if not answers:
        return jsonify({"success": False, "message": "No answers provided"}), 400

    raw_scores = {t: 0.0 for t in TRAITS}
    questions_count = {t: 0 for t in TRAITS}

    for ans in answers:
        trait = ans.get("trait")
        rating = ans.get("rating")

        if trait in TRAITS and isinstance(rating, int) and 1 <= rating <= 5:
            raw_scores[trait] += SCORE_MAP[rating]
            questions_count[trait] += 1

    normalized = normalize_scores(raw_scores, questions_count)

    # Find top 3 traits
    sorted_traits = sorted(normalized.items(), key=lambda x: x[1], reverse=True)
    top_traits = [{"trait": t, "score": s} for t, s in sorted_traits[:3]]

    return jsonify({
        "success": True,
        "raw_scores": raw_scores,
        "normalized_scores": normalized,
        "top_traits": top_traits
    }), 200


# POST /api/quiz/generate-mcq - Generate MCQ questions based on Q&A history
@quiz_routes.route("/quiz/generate-mcq", methods=["POST"])
def generate_mcq():
    """
    Generate MCQ questions to refine career prediction.
    Body: {
        "qa_history": [
            { "trait": "R", "question": "...", "rating": 4 },
            ...
        ],
        "num_questions": 5  # optional, default 5
    }
    """
    data = request.get_json() or {}
    qa_history = data.get("qa_history", [])
    num_questions = data.get("num_questions", 5)

    if not qa_history:
        return jsonify({"success": False, "message": "No Q&A history provided"}), 400

    if not model:
        return jsonify({"success": False, "message": "Gemini API not configured"}), 500

    qa_lines = [
        f"{idx}. Trait={item['trait']} | Q='{item['question']}' | Rating={item['rating']}"
        for idx, item in enumerate(qa_history, 1)
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

    try:
        text = call_gemini(prompt).strip()

        # Try direct JSON parse
        try:
            questions = json.loads(text).get("questions", [])
        except:
            # Try extracting JSON from response
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1:
                questions = json.loads(text[start:end + 1]).get("questions", [])
            else:
                questions = []

        return jsonify({
            "success": True,
            "questions": questions
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# POST /api/quiz/recommendations - Get career recommendations
@quiz_routes.route("/quiz/recommendations", methods=["POST"])
def get_recommendations():
    """
    Get career recommendations based on Q&A history and scores.
    Body: {
        "qa_history": [
            { "trait": "R", "question": "...", "rating": 4 },
            ...
        ],
        "normalized_scores": { "R": 0.75, "I": 0.5, ... }  # optional
    }
    """
    data = request.get_json() or {}
    qa_history = data.get("qa_history", [])
    normalized_scores = data.get("normalized_scores")

    if not qa_history:
        return jsonify({"success": False, "message": "No Q&A history provided"}), 400

    if not model:
        return jsonify({"success": False, "message": "Gemini API not configured"}), 500

    # Calculate scores if not provided
    if not normalized_scores:
        raw_scores = {t: 0.0 for t in TRAITS}
        questions_count = {t: 0 for t in TRAITS}

        for ans in qa_history:
            trait = ans.get("trait")
            rating = ans.get("rating")
            if trait in TRAITS and isinstance(rating, int) and 1 <= rating <= 5:
                raw_scores[trait] += SCORE_MAP[rating]
                questions_count[trait] += 1

        normalized_scores = normalize_scores(raw_scores, questions_count)

    try:
        prompt = build_recommendation_prompt(qa_history, normalized_scores)
        text = call_gemini(prompt).strip()

        # Try direct JSON parse
        try:
            result = json.loads(text)
        except:
            # Try extracting JSON from response
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1:
                result = json.loads(text[start:end + 1])
            else:
                result = None

        if result:
            return jsonify({
                "success": True,
                "recommendations": result.get("recommendations", []),
                "normalized_scores": normalized_scores
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Failed to parse recommendations",
                "raw_response": text
            }), 500

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# POST /api/quiz/submit - Complete quiz submission (all-in-one)
@quiz_routes.route("/quiz/submit", methods=["POST"])
def submit_quiz():
    """
    Complete quiz submission - calculates scores and gets recommendations.
    Body: {
        "answers": [
            { "trait": "R", "question": "...", "rating": 4 },
            ...
        ],
        "mcq_answers": [  # optional
            { "question": "...", "answer": "A" },
            ...
        ]
    }
    """
    data = request.get_json() or {}
    answers = data.get("answers", [])
    mcq_answers = data.get("mcq_answers", [])

    if not answers:
        return jsonify({"success": False, "message": "No answers provided"}), 400

    # Calculate scores
    raw_scores = {t: 0.0 for t in TRAITS}
    questions_count = {t: 0 for t in TRAITS}

    for ans in answers:
        trait = ans.get("trait")
        rating = ans.get("rating")
        if trait in TRAITS and isinstance(rating, int) and 1 <= rating <= 5:
            raw_scores[trait] += SCORE_MAP[rating]
            questions_count[trait] += 1

    normalized_scores = normalize_scores(raw_scores, questions_count)

    # Build Q&A history including MCQs
    qa_history = answers.copy()
    for mcq in mcq_answers:
        qa_history.append({
            "trait": "MCQ",
            "question": mcq.get("question", ""),
            "rating": mcq.get("answer", "")
        })

    # Get recommendations if Gemini is configured
    recommendations = []
    if model:
        try:
            prompt = build_recommendation_prompt(qa_history, normalized_scores)
            text = call_gemini(prompt).strip()

            try:
                result = json.loads(text)
                recommendations = result.get("recommendations", [])
            except:
                start = text.find("{")
                end = text.rfind("}")
                if start != -1 and end != -1:
                    result = json.loads(text[start:end + 1])
                    recommendations = result.get("recommendations", [])
        except Exception as e:
            print(f"Recommendation error: {e}")

    # Find top traits
    sorted_traits = sorted(normalized_scores.items(), key=lambda x: x[1], reverse=True)
    top_traits = [{"trait": t, "score": s} for t, s in sorted_traits[:3]]

    return jsonify({
        "success": True,
        "raw_scores": raw_scores,
        "normalized_scores": normalized_scores,
        "top_traits": top_traits,
        "recommendations": recommendations
    }), 200
