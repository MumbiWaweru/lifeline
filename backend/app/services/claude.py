"""Claude API client wrapper with enhanced stub for offline demo."""

import json
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import httpx
from textblob import TextBlob


@dataclass
class ChatResult:
    reply: str
    risk_level: str
    hotlines: List[Dict[str, str]]


class ClaudeClient:
    def __init__(self, api_key: str | None, model: str) -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.anthropic.com/v1/messages"
        # For stub mode, we keep conversation memory per session
        self._session_memory: Dict[str, List[Dict[str, str]]] = {}

    # --- Small helpers to keep stub replies warm and contextual ---
    def _init_history(self, session_id: Optional[str]) -> List[Dict[str, str]]:
        """Return the rolling conversation history for a session."""
        if session_id:
            if session_id not in self._session_memory:
                self._session_memory[session_id] = []
            return self._session_memory[session_id]
        return []

    def _remember(self, session_id: Optional[str], role: str, content: str, **extra: Any) -> None:
        """Store a turn in memory (optionally annotated) and trim to last 8 entries (4 exchanges)."""
        if not session_id:
            return
        history = self._session_memory.setdefault(session_id, [])
        history.append({"role": role, "content": content, **extra})
        if len(history) > 8:
            history.pop(0)

    def _reflect_message(self, message: str, recent_history: List[Dict[str, str]]) -> str:
        """Mirror back key details to feel personal without overpromising."""
        clean = re.sub(r"\s+", " ", message).strip()
        excerpt = clean[:140] + ("..." if len(clean) > 140 else "")
        prior = next((m["content"] for m in reversed(recent_history) if m.get("role") == "user"), "")
        prior_excerpt = prior[:80] + ("..." if len(prior) > 80 else "") if prior else ""

        if prior_excerpt and prior_excerpt == excerpt:
            return "I hear how serious this is and I'm here with you."
        if prior_excerpt:
            return f"You mentioned earlier '{prior_excerpt}', and now you're saying '{excerpt}'."
        if excerpt:
            return f"I hear you sharing that '{excerpt}'."
        return "I hear you."

    def _reflect_message_sw(self, message: str, recent_history: List[Dict[str, str]]) -> str:
        """Simplified Swahili mirroring for familiarity."""
        clean = re.sub(r"\s+", " ", message).strip()
        excerpt = clean[:120] + ("..." if len(clean) > 120 else "")
        prior = next((m["content"] for m in reversed(recent_history) if m.get("role") == "user"), "")
        prior_excerpt = prior[:70] + ("..." if len(prior) > 70 else "") if prior else ""

        if prior_excerpt and prior_excerpt == excerpt:
            return "Ninatambua jinsi hili ni zito na niko hapa na wewe."
        if prior_excerpt:
            return f"Ulinitajia awali '{prior_excerpt}', sasa unasema '{excerpt}'."
        if excerpt:
            return f"Nakusikia ukisema '{excerpt}'."
        return "Niko hapa kukusikia."

    def _choose_phrase(self, options: List[str], seed_text: str) -> str:
        """Pick a phrase deterministically based on the message to avoid robotic repetition."""
        seed = sum(ord(c) for c in seed_text) or 1
        return options[seed % len(options)]

    def _safety_tip(self, risk: str) -> str:
        if risk == "red":
            return "If you are not safe right now, move to the nearest safe space and call 999 or 1195."
        if risk == "amber":
            return "Consider keeping essentials ready (ID, phone charge, small cash) and a trusted contact you can reach quickly."
        return "If anything changes and you feel unsafe, 1195 is available 24/7 for confidential help."

    def _safety_tip_sw(self, risk: str) -> str:
        if risk == "red":
            return "Ikiwa hauko salama sasa, tafuta sehemu salama iliyo karibu na upige 999 au 1195."
        if risk == "amber":
            return "Weka vitu muhimu tayari (kitambulisho, simu ikiwa na chaji, hela kidogo) na mtu unayemwamini wa kuwasiliana naye haraka."
        return "Kama jambo likibadilika na ujisikie hatarini, 1195 inapatikana saa 24 kwa msaada wa siri."

    def _system_prompt(self, language: str) -> str:
        return (
            "You are a trauma-informed GBV support bot for Kenya. "
            "Respond concisely and compassionately in the user's language. "
            "Analyze the message and return JSON with keys reply (string), risk_level (green|amber|red), "
            "and hotlines (array of {name, number, type}). "
            "Avoid extra text outside JSON. Keep advice practical and safety-first. Language: "
            f"{language}."
        )

    async def generate(self, message: str, language: str, session_id: Optional[str] = None) -> ChatResult:
        # If API key is provided and valid, use real Claude
        if self.api_key and self.api_key.startswith("sk-"):
            return await self._real_claude(message, language)
        else:
            # Use enhanced stub
            return self._enhanced_stub(message, language, session_id)

    async def _real_claude(self, message: str, language: str) -> ChatResult:
        payload: Dict[str, Any] = {
            "model": self.model,
            "max_tokens": 400,
            "system": self._system_prompt(language),
            "messages": [{"role": "user", "content": message}],
        }
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
        content_blocks = data.get("content", [])
        if content_blocks and isinstance(content_blocks[0], dict):
            text = content_blocks[0].get("text", "{}")
        else:
            text = "{}"
        return self._parse_json_response(text, language)

    def _parse_json_response(self, text: str, language: str) -> ChatResult:
        try:
            parsed = json.loads(text)
            reply = parsed.get("reply") or "I am here to support you."
            risk_level = parsed.get("risk_level") or "green"
            hotlines = parsed.get("hotlines") or self._default_hotlines(language)
        except json.JSONDecodeError:
            reply = text or "I am here to support you."
            risk_level = "amber" if self._looks_urgent(text) else "green"
            hotlines = self._default_hotlines(language)
        return ChatResult(reply=reply, risk_level=risk_level, hotlines=hotlines)

    def _default_hotlines(self, language: str) -> List[Dict[str, str]]:
        return [
            {"name": "Gender Violence Recovery Centre", "number": "1195", "type": "hotline"},
            {"name": "Kenya Police Emergency", "number": "999", "type": "emergency"},
        ]

    def _looks_urgent(self, text: str) -> bool:
        lower = text.lower()
        return any(word in lower for word in ["danger", "hurt", "threat", "violence", "kill", "die"])

    # ----- ENHANCED STUB WITH RISK SCORING, SENTIMENT, AND MEMORY -----
    def _enhanced_stub(self, message: str, language: str, session_id: Optional[str] = None) -> ChatResult:
        history = self._init_history(session_id)
        self._remember(session_id, "user", message)

        lower_msg = message.lower()
        risk_score = 0

        # Risk scoring tuned for immediacy vs. control patterns
        high_risk = [
            "kill", "murder", "weapon", "gun", "knife", "choke", "strangle",
            "threaten", "death", "suicide", "hospital", "blood", "broken",
            "rape", "assault", "attack", "die", "emergency", "bleeding",
            "stab", "burn", "poison"
        ]
        medium_risk = [
            "shout", "yell", "angry", "alcohol", "drunk", "control", "money",
            "isolate", "follow", "watch", "jealous", "accuse", "blame",
            "scared", "afraid", "fear", "worry", "hurt", "pain", "threat",
            "locked", "nowhere", "trap", "stuck"
        ]

        for word in high_risk:
            if re.search(rf"\b{re.escape(word)}\b", lower_msg):
                risk_score += 3
        for word in medium_risk:
            if re.search(rf"\b{re.escape(word)}\b", lower_msg):
                risk_score += 1

        # Sentiment analysis (TextBlob) to capture tone
        try:
            polarity = TextBlob(message).sentiment.polarity  # -1 (negative) to +1 (positive)
            if polarity < -0.35:
                risk_score += 2
            elif polarity < -0.15:
                risk_score += 1
        except Exception:
            pass

        # Boost risk if previous turn was high
        recent_flags = [m for m in history if m.get("role") == "assistant" and m.get("risk") == "red"]
        if recent_flags:
            risk_score += 1

        if risk_score >= 4:
            risk_level = "red"
        elif risk_score >= 1:
            risk_level = "amber"
        else:
            risk_level = "green"

        reply = self._generate_contextual_reply(message, risk_level, language, history)
        self._remember(session_id, "assistant", reply, risk=risk_level)

        return ChatResult(reply=reply, risk_level=risk_level, hotlines=self._default_hotlines(language))

    def _generate_contextual_reply(self, message: str, risk: str, language: str, history: List[Dict]) -> str:
        opener_en = [
            "I'm here with you.",
            "Thank you for trusting me with this.",
            "I'm listening and want to help.",
        ]
        opener_sw = [
            "Niko hapa na wewe.",
            "Asante kwa kuniambia.",
            "Ninakusikiliza na nataka kukusaidia.",
        ]

        reflection_en = self._reflect_message(message, history)
        reflection_sw = self._reflect_message_sw(message, history)

        body_en = {
            "red": "Your safety is the top priority. If you can, stay out of sight and call 999 or 1195 now. If speaking is risky, send a short 'I need help' text or code word to a trusted person and keep your phone charged.",
            "amber": "What you're describing sounds like harmful or controlling behaviour. You deserve safety and respect. Let's plan one small step you can take today—who nearby could you alert or stay with?",
            "green": "Thank you for opening up. I'm here to support and listen. We can unpack what feels hardest right now or practise what to say to someone you trust.",
        }
        body_sw = {
            "red": "Usalama wako ni muhimu sana. Ukiweza, baki mafichoni kisha piga 999 au 1195 sasa. Ikiwa kuongea si salama, tuma ujumbe mfupi au neno la siri 'nahitaji msaada' kwa mtu unayemwamini na uhakikishe simu ina chaji.",
            "amber": "Unachoeleza kinaonekana kama udhibiti au unyanyasaji. Unastahili usalama na heshima. Tuweke mpango mdogo wa leo—ni nani karibu unayemwamini wa kumjulisha au kukaa naye?",
            "green": "Asante kwa kushiriki. Niko hapa kukusikiliza na kukusaidia. Tunaweza kuzungumzia kinachokusumbua zaidi sasa au mazoeze jinsi ya kumwambia mtu unayemwamini.",
        }

        follow_up_en = {
            "red": "Can you move somewhere safer right now, even briefly?",
            "amber": "Is there someone nearby you trust who could be with you or check in soon?",
            "green": "What feels like the biggest weight on you at this moment?",
        }
        follow_up_sw = {
            "red": "Unaweza kuhamia mahali salama sasa, hata kwa muda mfupi?",
            "amber": "Kuna mtu karibu unayemwamini ambaye anaweza kuwa na wewe au kukuangalia sasa?",
            "green": "Ni jambo gani linakulemea zaidi sasa?",
        }

        reply_parts_en = [
            self._choose_phrase(opener_en, message),
            reflection_en,
            body_en[risk],
            self._safety_tip(risk),
            follow_up_en[risk],
        ]

        reply_parts_sw = [
            self._choose_phrase(opener_sw, message),
            reflection_sw,
            body_sw[risk],
            self._safety_tip_sw(risk),
            follow_up_sw[risk],
        ]

        if language == "sw":
            return " ".join(reply_parts_sw)
        return " ".join(reply_parts_en)

    # Compatibility alias for callers expecting the older stub method name
    def _stub_response(self, message: str, language: str, session_id: Optional[str] = None) -> ChatResult:
        return self._enhanced_stub(message, language, session_id)