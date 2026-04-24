"""
Google Gemini API client wrapper for risk assessment and replies.

Uses Google's Gemini generative AI with free tier access.

To use:
1. Get API key from https://aistudio.google.com/
2. Set in backend/.env: GEMINI_API_KEY=your_key_here
3. Restart the backend

Why Gemini:
- Free tier available (no credit card required for initial use)
- Similar response quality to Claude
- Easy to set up
"""

import json
from dataclasses import dataclass
from typing import Any, Dict, List

import google.generativeai as genai


@dataclass
class ChatResult:
    reply: str
    risk_level: str
    hotlines: List[Dict[str, str]]


SYSTEM_PROMPT = """You are a trauma-informed AI support assistant for the Lifeline GBV (Gender-Based Violence) platform in Kenya.

Your role:
- Provide deeply compassionate, non-judgmental support to GBV survivors
- Validate their experiences and emotions
- Ask thoughtful follow-up questions to better understand their situation
- Assess risk level based on the conversation
- Provide practical safety guidance
- Connect survivors with relevant local resources

CRITICAL - Empathy Guidelines:
✓ Always acknowledge their courage for sharing
✓ Validate their feelings (fear, anger, shame, confusion are all normal)
✓ Use their name when mentioned - it builds trust
✓ Show genuine care and concern throughout
✓ Ask follow-up questions like:
  - "How are you feeling right now?"
  - "Do you have a safe place to go?"
  - "Is there someone you trust who can help?"
  - "When did this start happening?"
✓ Connect what they share to resources

ALWAYS respond in JSON format with these exact keys:
{
  "reply": "your empathetic response with follow-up questions in the user's language",
  "risk_level": "green" | "amber" | "red",
  "hotlines": [{"name": "hotline name", "number": "phone number", "type": "hotline|emergency|legal|medical"}]
}

Risk assessment criteria:
- green: No immediate danger, seeking information or general support
- amber: Warning signs present — controlling behavior, isolation, threats, fear
- red: Immediate danger — physical violence occurring/imminent, weapons mentioned, severe threats

Always include at minimum:
- GVRC Hotline: 1195 (green/amber/red - counseling and support)
- Kenya Police: 999 (red only - emergency)
- Kituo cha Sheria: 0800 720 185 (amber/red for legal help)

Response Style:
- Warm, genuine, and deeply compassionate
- Never clinical or robotic
- Short but meaningful responses (2-3 sentences max)
- Always end with a caring follow-up question or next step
- Respond in the same language the user writes in (English or Swahili)

Example good responses:
EN: "I'm so sorry you're going through this. Your safety is what matters most right now. Do you have somewhere safe you can go?"
SW: "Ninasikiliza wewe, na hili ni kigumu sana. Usalama wako ni muhimu. Je, una mahali salama unaweza kwenda?"

Do NOT include any text outside the JSON object."""


class GeminiClient:
    def __init__(self, api_key: str | None) -> None:
        self.api_key = api_key
        if api_key:
            genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            model_name="gemini-pro",
            system_instruction=SYSTEM_PROMPT
        )

    async def generate(self, message: str, language: str, name: str = "") -> ChatResult:
        """Generate a response using Gemini API. Falls back to heuristic if API unavailable."""
        if not self.api_key:
            print("⚠️  GEMINI_API_KEY not set — using offline heuristic mode")
            return self._stub_response(message, language, name)

        try:
            response = self.model.generate_content(message)
            text = response.text if response else ""
            return self._parse_json_response(text, language, name)
        
        except Exception as e:
            print(f"⚠️  Gemini API error: {e} — using offline fallback")
            return self._stub_response(message, language, name)

    def _parse_json_response(self, text: str, language: str, name: str = "") -> ChatResult:
        """Parse JSON response from Gemini, with graceful fallback."""
        clean = text.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        try:
            parsed = json.loads(clean)
            reply = parsed.get("reply") or self._default_reply(language, name)
            risk_level = parsed.get("risk_level") or "green"
            hotlines = parsed.get("hotlines") or self._default_hotlines(language)
        except json.JSONDecodeError:
            reply = text or self._default_reply(language, name)
            risk_level = "amber" if self._looks_urgent(text) else "green"
            hotlines = self._default_hotlines(language)
        return ChatResult(reply=reply, risk_level=risk_level, hotlines=hotlines)

    def _default_reply(self, language: str, name: str = "") -> str:
        name_greeting = f", {name}," if name else ""
        if language == "sw":
            return f"Asante kwa kufikia{name_greeting} na kuisikiliza. Ujasuri wako wa kuzungumza ni muhimu sana. Fadhali sema kile unachohisi."
        return f"I'm here to listen and support you without judgment{name_greeting}. It took courage to reach out. Share what feels right for you."

    def _default_hotlines(self, language: str) -> List[Dict[str, str]]:
        return [
            {"name": "GVRC National Hotline", "number": "1195", "type": "hotline"},
            {"name": "Kenya Police Emergency", "number": "999", "type": "emergency"},
        ]

    def _looks_urgent(self, text: str) -> bool:
        lower = text.lower()
        urgent_words = ["danger", "hurt", "threat", "violence", "kill", "scared", "help", "attack"]
        return any(word in lower for word in urgent_words)

    def _stub_response(self, message: str, language: str, name: str = "") -> ChatResult:
        """
        Offline demo response with heuristic NLP risk assessment.
        Used when GEMINI_API_KEY is not set or API is unavailable.
        """
        m = message.lower()
        critical = ["kill", "dead", "weapon", "gun", "knife", "strangle", "rape", "attack", "murder", "blood"]
        high = ["hurt", "hit", "beaten", "threatened", "afraid", "scared", "danger", "trapped", "escape", "assault"]
        medium = ["control", "angry", "yell", "drunk", "jealous", "follow", "isolate", "blame", "money"]

        crit_count = sum(1 for w in critical if w in m)
        high_count = sum(1 for w in high if w in m)
        med_count = sum(1 for w in medium if w in m)

        if crit_count >= 1 or high_count >= 2:
            risk = "red"
            name_greeting = f", {name}," if name else ""
            if language == "sw":
                reply = f"Ninahangaika kuhusu usalama wako sasa{name_greeting}. Kile unachokieleza ni hatari sana. Nenda mahali salama na piga simu 999 au 1195 mara moja. Haulii peke yako katika hili."
            else:
                reply = f"I'm deeply concerned about your safety right now{name_greeting}. What you're describing sounds dangerous. Please call 999 (police) or 1195 (GBV hotline) immediately. If in immediate danger, prioritize getting to safety. You're not alone."
            hotlines = [
                {"name": "Kenya Police Emergency", "number": "999", "type": "emergency"},
                {"name": "GVRC Hotline", "number": "1195", "type": "hotline"},
                {"name": "Wangu Kanja Foundation", "number": "0711 200 400", "type": "organization"},
            ]
        elif high_count >= 1 or med_count >= 2:
            risk = "amber"
            name_greeting = f", {name}," if name else ""
            if language == "sw":
                reply = f"Nakusikia wewe{name_greeting} na hili ni kigumu. Mpango salama ni muhimu — je, una mahali salama unaweza kwenda? Pia, piga simu 1195 kuzungumza na mtaalamu."
            else:
                reply = f"I hear you{name_greeting}, and what you're experiencing matters. Creating a safety plan can help — do you have somewhere safe you could go? Please also contact 1195 (GVRC) to speak with trained counselors. You deserve support."
            hotlines = [
                {"name": "GVRC Hotline", "number": "1195", "type": "hotline"},
                {"name": "Kituo cha Sheria (Legal Aid)", "number": "0800 720 185", "type": "legal"},
            ]
        else:
            risk = "green"
            name_greeting = f", {name}," if name else ""
            if language == "sw":
                reply = f"Asante kwa kufikia{name_greeting} — ujasuri wako ni muhimu. Niko hapa kuisikiliza bila kuhukumu. Unaweza kusema zaidi?"
            else:
                reply = f"Thank you for reaching out{name_greeting} — your courage matters. I'm here to listen without judgment. Can you tell me more about what's been happening?"
            hotlines = [
                {"name": "GVRC Hotline", "number": "1195", "type": "hotline"},
            ]

        return ChatResult(reply=reply, risk_level=risk, hotlines=hotlines)
