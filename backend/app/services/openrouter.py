"""OpenRouter chat client wrapper for risk assessment and replies."""

import json
from dataclasses import dataclass
from typing import Dict, List

import httpx


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
- Always acknowledge their courage for sharing
- Validate their feelings (fear, anger, shame, confusion are all normal)
- Use their name when mentioned - it builds trust
- Show genuine care and concern throughout
- Ask follow-up questions like:
  - "How are you feeling right now?"
  - "Do you have a safe place to go?"
  - "Is there someone you trust who can help?"
  - "When did this start happening?"
- Connect what they share to resources

ALWAYS respond in JSON format with these exact keys:
{
  "reply": "your empathetic response with follow-up questions in the user's language",
  "risk_level": "green" | "amber" | "red",
  "hotlines": [{"name": "hotline name", "number": "phone number", "type": "hotline|emergency|legal|medical"}]
}

Risk assessment criteria:
- green: No immediate danger, seeking information or general support
- amber: Warning signs present - controlling behavior, isolation, threats, fear
- red: Immediate danger - physical violence occurring/imminent, weapons mentioned, severe threats

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

Do NOT include any text outside the JSON object."""


class OpenRouterClient:
    def __init__(self, api_key: str | None, model: str) -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

    async def generate(self, message: str, language: str, name: str = "") -> ChatResult:
        """Generate a response using OpenRouter. Falls back to heuristic mode."""
        if not self.api_key:
            return self._stub_response(message, language, name)

        user_content = self._build_user_content(message=message, language=language, name=name)
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.3,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://lifeline.local",
            "X-Title": "lifeline-backend",
        }

        try:
            async with httpx.AsyncClient(timeout=25) as client:
                response = await client.post(self.base_url, headers=headers, json=payload)
                response.raise_for_status()
            data = response.json()
            text = self._extract_message_text(data)
            return self._parse_json_response(text, language, name)
        except Exception:
            return self._stub_response(message, language, name)

    def _build_user_content(self, message: str, language: str, name: str) -> str:
        name_context = f"Name: {name.strip()}\n" if name and name.strip() else ""
        return (
            f"{name_context}"
            f"Language: {language}\n"
            "Respond in strict JSON only using the required schema.\n"
            f"User message: {message}"
        )

    def _extract_message_text(self, data: Dict[str, object]) -> str:
        choices = data.get("choices", [])
        if not isinstance(choices, list) or not choices:
            return ""
        first = choices[0]
        if not isinstance(first, dict):
            return ""
        message = first.get("message", {})
        if not isinstance(message, dict):
            return ""
        content = message.get("content", "")
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts: List[str] = []
            for item in content:
                if isinstance(item, dict):
                    text = item.get("text")
                    if isinstance(text, str):
                        parts.append(text)
            return "\n".join(parts)
        return ""

    def _parse_json_response(self, text: str, language: str, name: str = "") -> ChatResult:
        clean = text.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        try:
            parsed = json.loads(clean)
            reply = parsed.get("reply") or self._default_reply(language, name)
            risk_level = parsed.get("risk_level") or "green"
            hotlines = parsed.get("hotlines") or self._default_hotlines()
        except json.JSONDecodeError:
            reply = text or self._default_reply(language, name)
            risk_level = "amber" if self._looks_urgent(text) else "green"
            hotlines = self._default_hotlines()
        return ChatResult(reply=reply, risk_level=risk_level, hotlines=hotlines)

    def _default_reply(self, language: str, name: str = "") -> str:
        name_greeting = f", {name}," if name else ""
        if language == "sw":
            return (
                f"Asante kwa kufikia{name_greeting} na kuisikiliza. "
                "Ujasuri wako wa kuzungumza ni muhimu sana. "
                "Fadhali sema kile unachohisi."
            )
        return (
            f"I'm here to listen and support you without judgment{name_greeting}. "
            "It took courage to reach out. "
            "Share what feels right for you."
        )

    def _default_hotlines(self) -> List[Dict[str, str]]:
        return [
            {"name": "GVRC National Hotline", "number": "1195", "type": "hotline"},
            {"name": "Kenya Police Emergency", "number": "999", "type": "emergency"},
        ]

    def _looks_urgent(self, text: str) -> bool:
        lower = text.lower()
        urgent_words = ["danger", "hurt", "threat", "violence", "kill", "scared", "help", "attack"]
        return any(word in lower for word in urgent_words)

    def _stub_response(self, message: str, language: str, name: str = "") -> ChatResult:
        """Offline response with heuristic risk assessment."""
        m = message.lower()
        critical = ["kill", "dead", "weapon", "gun", "knife", "strangle", "rape", "attack", "murder", "blood"]
        high = ["hurt", "hit", "beaten", "threatened", "afraid", "scared", "danger", "trapped", "escape", "assault"]
        medium = ["control", "angry", "yell", "drunk", "jealous", "follow", "isolate", "blame", "money"]

        crit_count = sum(1 for word in critical if word in m)
        high_count = sum(1 for word in high if word in m)
        med_count = sum(1 for word in medium if word in m)

        if crit_count >= 1 or high_count >= 2:
            risk = "red"
            name_greeting = f", {name}," if name else ""
            if language == "sw":
                reply = (
                    f"Ninahangaika kuhusu usalama wako sasa{name_greeting}. "
                    "Kile unachokieleza ni hatari sana. "
                    "Nenda mahali salama na piga simu 999 au 1195 mara moja. "
                    "Haulii peke yako katika hili."
                )
            else:
                reply = (
                    f"I'm deeply concerned about your safety right now{name_greeting}. "
                    "What you're describing sounds dangerous. "
                    "Please call 999 (police) or 1195 (GBV hotline) immediately. "
                    "If in immediate danger, prioritize getting to safety. You're not alone."
                )
            hotlines = [
                {"name": "Kenya Police Emergency", "number": "999", "type": "emergency"},
                {"name": "GVRC Hotline", "number": "1195", "type": "hotline"},
                {"name": "Wangu Kanja Foundation", "number": "0711 200 400", "type": "organization"},
            ]
        elif high_count >= 1 or med_count >= 2:
            risk = "amber"
            name_greeting = f", {name}," if name else ""
            if language == "sw":
                reply = (
                    f"Nakusikia wewe{name_greeting} na hili ni kigumu. "
                    "Mpango salama ni muhimu - je, una mahali salama unaweza kwenda? "
                    "Pia, piga simu 1195 kuzungumza na mtaalamu."
                )
            else:
                reply = (
                    f"I hear you{name_greeting}, and what you're experiencing matters. "
                    "Creating a safety plan can help - do you have somewhere safe you could go? "
                    "Please also contact 1195 (GVRC) to speak with trained counselors. "
                    "You deserve support."
                )
            hotlines = [
                {"name": "GVRC Hotline", "number": "1195", "type": "hotline"},
                {"name": "Kituo cha Sheria (Legal Aid)", "number": "0800 720 185", "type": "legal"},
            ]
        else:
            risk = "green"
            name_greeting = f", {name}," if name else ""
            if language == "sw":
                reply = (
                    f"Asante kwa kufikia{name_greeting} - ujasuri wako ni muhimu. "
                    "Niko hapa kuisikiliza bila kuhukumu. "
                    "Unaweza kusema zaidi?"
                )
            else:
                reply = (
                    f"Thank you for reaching out{name_greeting} - your courage matters. "
                    "I'm here to listen without judgment. "
                    "Can you tell me more about what's been happening?"
                )
            hotlines = [
                {"name": "GVRC Hotline", "number": "1195", "type": "hotline"},
            ]

        return ChatResult(reply=reply, risk_level=risk, hotlines=hotlines)
