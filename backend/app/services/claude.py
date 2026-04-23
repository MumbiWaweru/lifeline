"""Claude API client wrapper for risk assessment and replies."""

import json
from dataclasses import dataclass
from typing import Any, Dict, List

import httpx


@dataclass
class ChatResult:
    reply: str
    risk_level: str
    hotlines: List[Dict[str, str]]


SYSTEM_PROMPT = """You are a trauma-informed AI support assistant for the Lifeline GBV (Gender-Based Violence) platform in Kenya.

Your role:
- Provide compassionate, non-judgmental support to GBV survivors
- Assess risk level based on the conversation
- Provide practical safety guidance
- Connect survivors with relevant local resources

ALWAYS respond in JSON format with these exact keys:
{
  "reply": "your compassionate, practical response in the user's language",
  "risk_level": "green" | "amber" | "red",
  "hotlines": [{"name": "hotline name", "number": "phone number", "type": "hotline|emergency|legal|medical"}]
}

Risk assessment criteria:
- green: No immediate danger, seeking information or general support
- amber: Warning signs present — controlling behavior, isolation, threats, fear
- red: Immediate danger — physical violence occurring/imminent, weapons mentioned, severe threats

Always include at minimum:
- GVRC Hotline: 1195 (green/amber/red)
- Kenya Police: 999 (red only)
- Kituo cha Sheria: 0800 720 185 (amber/red for legal help)

Tone: Warm, calm, never clinical. Validate the survivor's experience. Focus on safety first.
Language: Respond in the same language the user writes in (English or Swahili).
Do NOT include any text outside the JSON object."""


class ClaudeClient:
    def __init__(self, api_key: str | None, model: str) -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.anthropic.com/v1/messages"

    async def generate(self, message: str, language: str, name: str = "") -> ChatResult:
        if not self.api_key:
            return self._stub_response(message, language, name)

        payload: Dict[str, Any] = {
            "model": self.model,
            "max_tokens": 600,
            "system": SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": message}],
        }

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        content_blocks = data.get("content", [])
        text = ""
        for block in content_blocks:
            if isinstance(block, dict) and block.get("type") == "text":
                text = block.get("text", "")
                break

        return self._parse_json_response(text, language, name)

    def _parse_json_response(self, text: str, language: str, name: str = "") -> ChatResult:
        # Strip possible markdown code fences
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
            return f"Asante kwa kufikia{name_greeting} na kuisikiliza. Ujasuri wako wa kuzungumza ni muhimu sana. Fadhali sema kile unachohisi - mwenyewe au haraka yako."
        return f"I'm here to listen and support you without judgment{name_greeting}. It took courage to reach out. There's no rush—share what feels right for you."

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
        """Offline demo response with heuristic NLP risk assessment."""
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
                reply = f"Ninahangaika kuhusu usalama wako sasa{name_greeting}. Kile unachokieleza ni hatari sana. Haikufaa kuwa na mpango salama: nenda mahali salama ikiwa wezekana, na kupiga simu 999 (polisi) au 1195 (GVRC) mara moja. Haulii peke yako katika hili."
            else:
                reply = f"I'm deeply concerned about your safety right now{name_greeting}. What you're describing sounds dangerous. Please reach out to emergency services: call 999 (police) or 1195 (GVRC hotline) immediately. If you're in immediate danger, prioritize getting to safety. You don't have to face this alone."
            hotlines = [
                {"name": "Kenya Police Emergency", "number": "999", "type": "emergency"},
                {"name": "GVRC Hotline", "number": "1195", "type": "hotline"},
                {"name": "Wangu Kanja Foundation", "number": "0711 200 400", "type": "organization"},
            ]
        elif high_count >= 1 or med_count >= 2:
            risk = "amber"
            name_greeting = f", {name}," if name else ""
            if language == "sw":
                reply = f"Nakusikia wewe{name_greeting} na hili ni kigumu. Kile unachodeskriba inaonyesha hatari. Mpango salama ni mahali pema unaweza kwenda wakati wowote - je, una wanapiga akili, jamaa, au mahali unaweza kumaanisha? Pia, piga simu 1195 kuzungumza na mtaalamu anayejua kuhusu hii."
            else:
                reply = f"I hear you{name_greeting}, and what you're experiencing matters. Creating a safety plan can help: think about trusted people you could reach out to or safe places you could go. Please also contact 1195 (GVRC) to speak with trained counselors who specialize in supporting survivors. You deserve support."
            hotlines = [
                {"name": "GVRC Hotline", "number": "1195", "type": "hotline"},
                {"name": "Kituo cha Sheria (Legal Aid)", "number": "0800 720 185", "type": "legal"},
            ]
        else:
            risk = "green"
            name_greeting = f", {name}," if name else ""
            if language == "sw":
                reply = f"Asante kwa kufikia{name_greeting} - ujasuri wako ni muhimu. Niko hapa kuisikiliza bila kuhukumu. Kila kile unachohisi ni halali. Unaweza kusoma zaidi juu ya huduma za kusaidiana, kupata mawasiliano ya walisaidiana, au kuzungumza na mtu - yote hapa. Ukumbuke: wewe si peke yako."
            else:
                reply = f"Thank you for reaching out{name_greeting}—your courage matters. I'm here to listen without judgment. Your feelings are valid. You can explore support options, connect with others who've been through this, or simply talk. Remember: you're not alone, and what happened was not your fault."
            hotlines = [
                {"name": "GVRC Hotline", "number": "1195", "type": "hotline"},
            ]

        return ChatResult(reply=reply, risk_level=risk, hotlines=hotlines)