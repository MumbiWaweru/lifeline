"""
risk_engine.py — LIFELINE AI Risk Assessment Engine
Uses OpenRouter (Claude) for NLP-based 4-level risk classification
with LIME-style per-phrase explanation scores.
"""

import os
import re
import json
import httpx
import asyncio
from typing import Optional

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE    = "https://openrouter.ai/api/v1"
MODEL              = "anthropic/claude-3-haiku"   # fast + affordable via OpenRouter

# ── Risk levels ────────────────────────────────────────────────────────────────
RISK_LEVELS = ["low", "medium", "high", "critical"]

RISK_KEYWORDS = {
    "critical": [
        "kill", "murder", "weapon", "gun", "knife", "stab", "shoot",
        "going to die", "he will kill", "she will kill", "threatened to kill",
        "unconscious", "bleeding", "hospital", "emergency", "police now",
        "help me now", "trapped", "locked in",
    ],
    "high": [
        "hit", "punch", "slap", "choke", "beat", "assault", "rape",
        "sexual", "abuse", "violent", "danger", "afraid", "scared",
        "hurt", "bruise", "broken", "force", "threaten", "harass",
        "stalking", "following me", "unsafe", "nowhere to go",
    ],
    "medium": [
        "yell", "shout", "scream", "insult", "humiliate", "control",
        "jealous", "isolate", "manipulate", "pressure", "uncomfortable",
        "worried", "anxious", "argument", "fight", "conflict",
    ],
    "low": [
        "confused", "question", "advice", "information", "help",
        "resource", "support", "counselor", "talk", "discuss",
    ],
}


# ── Heuristic fallback (no API key needed) ─────────────────────────────────────
def _heuristic_risk(text: str) -> dict:
    """Keyword-based fallback when OpenRouter is unavailable."""
    text_lower = text.lower()
    matched: list[tuple[str, str, float]] = []

    for level, keywords in RISK_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                score = {"critical": 0.95, "high": 0.75, "medium": 0.50, "low": 0.25}[level]
                matched.append((kw, level, score))

    if not matched:
        return {
            "risk_level": "low",
            "risk_score": 0.15,
            "confidence": 0.70,
            "explanation": [{"phrase": "general inquiry", "score": 0.15, "label": "low"}],
        }

    # Pick highest risk level found
    level_order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
    matched.sort(key=lambda x: level_order[x[1]], reverse=True)
    top_level = matched[0][1]
    top_score = matched[0][2]

    explanations = [
        {"phrase": m[0], "score": round(m[2], 2), "label": m[1]}
        for m in matched[:5]
    ]

    return {
        "risk_level": top_level,
        "risk_score": round(top_score, 2),
        "confidence": 0.72,
        "explanation": explanations,
    }


# ── OpenRouter / Claude classification ─────────────────────────────────────────
SYSTEM_PROMPT = """You are a trauma-informed AI safety analyst for a Gender-Based Violence (GBV) support platform in Kenya.

Your task is to assess the risk level of a survivor's message and return a structured JSON response.

Risk level definitions:
- "critical": Immediate physical danger, weapons involved, life-threatening situation — needs emergency response NOW
- "high": Active or recent physical/sexual abuse, direct threats, unsafe living situation — urgent intervention needed
- "medium": Emotional/psychological abuse, controlling behaviour, fear without immediate physical danger — timely support needed
- "low": Seeking information, confused, general questions, early-stage concern — supportive guidance needed

You MUST respond with ONLY valid JSON in this exact format (no markdown, no explanation outside JSON):
{
  "risk_level": "critical|high|medium|low",
  "risk_score": 0.0-1.0,
  "confidence": 0.0-1.0,
  "explanation": [
    {"phrase": "exact phrase from input", "score": 0.0-1.0, "label": "critical|high|medium|low"},
    ...up to 5 phrases...
  ],
  "summary": "one sentence clinical summary of the risk assessment"
}

Rules:
- Extract real phrases FROM the survivor's message for explanation
- Scores reflect contribution to overall risk
- Be trauma-sensitive — do not re-traumatise with harsh language in the summary
- When in doubt, classify higher (err on side of caution)
- Always return valid JSON"""


async def assess_risk(text: str, language: str = "en") -> dict:
    """
    Classify the risk level of a survivor message using Claude via OpenRouter.
    Falls back to heuristic if API is unavailable.
    """
    if not OPENROUTER_API_KEY:
        return _heuristic_risk(text)

    payload = {
        "model": MODEL,
        "max_tokens": 400,
        "temperature": 0.1,   # low temp for consistent classification
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": f"Assess this message (language: {language}):\n\n{text}"},
        ],
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lifeline.co.ke",
        "X-Title": "LIFELINE GBV Platform",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{OPENROUTER_BASE}/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
            raw = data["choices"][0]["message"]["content"].strip()

            # Strip any accidental markdown fences
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)

            result = json.loads(raw)

            # Validate and normalise
            if result.get("risk_level") not in RISK_LEVELS:
                result["risk_level"] = "medium"
            result["risk_score"]  = float(result.get("risk_score",  0.5))
            result["confidence"]  = float(result.get("confidence",  0.8))
            result["explanation"] = result.get("explanation", [])[:5]

            return result

    except (httpx.HTTPError, json.JSONDecodeError, KeyError, Exception):
        # Graceful fallback — never leave survivor without a response
        return _heuristic_risk(text)


# ── Trauma-informed response generator ────────────────────────────────────────
RESPONSE_SYSTEM = """You are a compassionate, trauma-informed support counselor for a GBV platform serving survivors in Kenya.

Guidelines:
- Acknowledge the survivor's courage in reaching out
- Validate their feelings without judgement
- Provide practical, actionable next steps based on risk level
- Keep responses warm, clear, and concise (150-250 words)
- For critical/high risk: prioritise immediate safety steps first
- For medium: focus on safety planning and resources
- For low: provide information and encourage continued dialogue
- End with one concrete action they can take right now
- If Swahili is requested, respond fully in Swahili
- Never use clinical jargon or make the survivor feel blamed"""

async def generate_response(
    text: str,
    risk_result: dict,
    conversation_history: list[dict],
    language: str = "en",
    name: Optional[str] = None,
) -> str:
    """Generate a trauma-informed response using Claude via OpenRouter."""
    if not OPENROUTER_API_KEY:
        return _fallback_response(risk_result["risk_level"], language, name)

    risk_level = risk_result["risk_level"]
    name_str   = f" {name}" if name else ""

    context_msg = (
        f"Survivor name: {name or 'not provided'}\n"
        f"Risk level assessed: {risk_level.upper()}\n"
        f"Risk score: {risk_result.get('risk_score', 0.5):.0%}\n"
        f"Key risk indicators: {', '.join(e['phrase'] for e in risk_result.get('explanation', []))}\n\n"
        f"Survivor's message: {text}"
    )

    messages = [{"role": "system", "content": RESPONSE_SYSTEM}]
    # Add recent conversation history (last 4 exchanges)
    for msg in conversation_history[-8:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": context_msg})

    payload = {
        "model": MODEL,
        "max_tokens": 350,
        "temperature": 0.7,
        "messages": messages,
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lifeline.co.ke",
        "X-Title": "LIFELINE GBV Platform",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                f"{OPENROUTER_BASE}/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return _fallback_response(risk_level, language, name)


def _fallback_response(risk_level: str, language: str, name: Optional[str]) -> str:
    name_str = f" {name}" if name else ""
    responses = {
        "critical": (
            f"You are not alone{name_str}. What you are describing sounds extremely dangerous. "
            "Please call the GBV hotline 1195 immediately or go to the nearest police station. "
            "If you cannot call, try to leave to a neighbour or public place. Your safety is the priority right now."
        ),
        "high": (
            f"Thank you for trusting us{name_str}. I hear you and I want you to know that what you are experiencing "
            "is not your fault. Please reach out to FIDA Kenya (0719 638 006) or the GBV hotline 1195. "
            "A counselor can help you create a safety plan. You deserve to be safe."
        ),
        "medium": (
            f"I'm glad you reached out{name_str}. Your concerns are valid and it takes courage to speak up. "
            "Consider speaking with a counselor who can provide confidential support. "
            "The GBV hotline 1195 is available 24/7. Would you like to know about local support services near you?"
        ),
        "low": (
            f"Hello{name_str}, thank you for reaching out. I'm here to help. "
            "You can ask me anything about safety, resources, or support services available to you. "
            "Everything you share here is confidential. What would you like to know more about?"
        ),
    }
    return responses.get(risk_level, responses["low"])