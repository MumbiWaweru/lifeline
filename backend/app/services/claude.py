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

CRITICAL RULES FOR EVERY RESPONSE:
1. If the user has shared their name, USE IT naturally in your reply (e.g. "I hear you, Amina" or "Thank you for telling me that, Sarah").
2. ALWAYS acknowledge the specific emotion or situation they described FIRST before giving advice.
   - If they say they are scared → "It makes complete sense that you're scared..."
   - If they say they are confused → "Feeling confused in this situation is completely understandable..."
   - If they describe violence → "What you've just described is not okay, and it is not your fault..."
3. NEVER jump straight to advice without first validating their feelings.
4. Keep your tone warm, human, and personal — not clinical or list-like.
5. End every response by inviting them to share more or asking one gentle follow-up question.

ALWAYS respond in JSON format with these exact keys:
{
  "reply": "your compassionate, personal response in the user's language",
  "risk_level": "green" | "amber" | "red",
  "hotlines": [{"name": "hotline name", "number": "phone number", "type": "hotline|emergency|legal|medical"}]
}

Risk assessment criteria:
- green: No immediate danger, seeking information or general support
- amber: Warning signs present — controlling behavior, isolation, threats, fear
- red: Immediate danger — physical violence occurring/imminent, weapons mentioned, severe threats

Always include at minimum:
- GVRC Hotline: 1195 (all risk levels)
- Kenya Police: 999 (red only)
- Kituo cha Sheria: 0800 720 185 (amber/red for legal help)

Language: Respond in the same language the user writes in (English or Swahili).
Do NOT include any text outside the JSON object."""


# Empathetic opening phrases by emotion keyword
EMPATHY_OPENERS_EN = {
    "scared":    "It makes complete sense that you're scared — what you're describing would frighten anyone.",
    "afraid":    "Being afraid in this situation is completely understandable, and I want you to know that feeling is valid.",
    "scared":    "It makes complete sense that you feel scared right now.",
    "lonely":    "Feeling alone in this is one of the hardest parts, and I'm glad you reached out.",
    "confused":  "Feeling confused about what's happening is completely normal — these situations are never simple.",
    "ashamed":   "I want you to hear this clearly: what is happening to you is not your fault, and you have nothing to be ashamed of.",
    "tired":     "Being exhausted by all of this is completely valid. You've been carrying so much.",
    "hopeless":  "Even when things feel hopeless, you reaching out right now shows incredible strength.",
    "angry":     "Your anger makes complete sense — what's been done to you is wrong.",
    "hurt":      "I'm so sorry you've been hurt. You didn't deserve that.",
    "trapped":   "Feeling trapped is real, and I want to help you see that options do exist, even when they feel invisible.",
    "helpless":  "Feeling helpless doesn't mean you are helpless. I'm here, and we can think through this together.",
    "desperate": "I can hear how desperate things feel right now, and I'm not going to leave you without support.",
}

EMPATHY_OPENERS_SW = {
    "scared":    "Ni kawaida kabisa kuhisi woga — hali unayoelezea ingeweza kumtia mtu yeyote hofu.",
    "afraid":    "Kuogopa katika hali hii ni jambo linaloeleweka, na hisia hiyo ni ya kweli.",
    "peke":      "Kuhisi peke yako ni mojawapo ya mambo magumu zaidi, na ninafurahi ulifika.",
    "confused":  "Kuhisi mkanganyiko kuhusu kinachoendelea ni kawaida kabisa — hali hizi hazieleweki rahisi.",
    "aibu":      "Nataka usikia hili wazi: kinachokupata si kosa lako, na huna sababu ya kuona aibu.",
    "choka":     "Kuchoka na hali hii ni jambo linaloeleweka. Umebeba mengi sana.",
    "trapped":   "Kuhisi umefungwa ni hali halisi, na nataka kukusaidia kuona kwamba chaguo zipo.",
}


def _get_empathy_opener(message: str, language: str) -> str:
    """Return an empathetic opener matched to keywords in the user's message."""
    m = message.lower()
    openers = EMPATHY_OPENERS_SW if language == "sw" else EMPATHY_OPENERS_EN
    for keyword, opener in openers.items():
        if keyword in m:
            return opener
    return ""


def _build_name_greeting(name: str, language: str) -> str:
    """Return a natural name acknowledgment string."""
    if not name or not name.strip():
        return ""
    n = name.strip().capitalize()
    if language == "sw":
        return f"{n}, "
    return f"{n}, "


class ClaudeClient:
    def __init__(self, api_key: str | None, model: str) -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.anthropic.com/v1/messages"

    async def generate(self, message: str, language: str, name: str = "") -> ChatResult:
        if not self.api_key:
            return self._stub_response(message, language, name)

        # Build a user content string that includes the name so Claude can use it
        name_context = f"[The user's name is {name.strip()}. Use their name naturally in your reply.]\n\n" if name and name.strip() else ""
        user_content = f"{name_context}{message}"

        payload: Dict[str, Any] = {
            "model": self.model,
            "max_tokens": 700,
            "system": SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": user_content}],
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
        greeting = _build_name_greeting(name, language)
        if language == "sw":
            return (
                f"Asante kwa kufikia, {greeting}na kwa ujasiri wa kuzungumza. "
                "Niko hapa kukusaidia bila kukuhukumu. "
                "Tafadhali niambie zaidi kuhusu unachopitia — chukua wakati wako."
            )
        return (
            f"Thank you for reaching out, {greeting}and for the courage it took to do so. "
            "I'm here to listen without judgment. "
            "Please tell me more about what's been happening — take all the time you need."
        )

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
        Offline fallback with:
        - Name acknowledgment
        - Emotion-matched empathy opener
        - Risk-appropriate guidance
        - A gentle follow-up question at the end
        """
        m = message.lower()

        # ── Risk keyword scoring ──────────────────────────────────────────
        critical = ["kill", "dead", "weapon", "gun", "knife", "strangle", "rape",
                    "attack", "murder", "blood", "choke", "stab"]
        high     = ["hurt", "hit", "beaten", "threatened", "afraid", "scared",
                    "danger", "trapped", "escape", "assault", "violence", "bruise"]
        medium   = ["control", "angry", "yell", "drunk", "jealous", "follow",
                    "isolate", "blame", "money", "shout", "humiliate", "watch"]

        crit_count = sum(1 for w in critical if w in m)
        high_count = sum(1 for w in high if w in m)
        med_count  = sum(1 for w in medium if w in m)

        # ── Shared building blocks ────────────────────────────────────────
        greeting     = _build_name_greeting(name, language)
        empathy_open = _get_empathy_opener(message, language)

        # ── RED ───────────────────────────────────────────────────────────
        if crit_count >= 1 or high_count >= 2:
            risk = "red"

            if language == "sw":
                empathy_sw = empathy_open or "Ninakusikia, na ninajali usalama wako sana."
                reply = (
                    f"{empathy_sw} "
                    f"{greeting}kile unachokielezea ni hatari na si kosa lako. "
                    "Sasa hivi, usalama wako ndio muhimu zaidi. "
                    "Ikiwa unaweza, nenda mahali salama — nyumba ya jirani, duka, au mahali penye watu. "
                    "Piga simu 999 (polisi) au 1195 (msaada wa GBV) mara moja ikiwa uko katika hatari. "
                    "Je, uko mahali salama sasa hivi?"
                )
            else:
                empathy_en = empathy_open or "I hear you, and I'm deeply concerned about your safety right now."
                reply = (
                    f"{empathy_en} "
                    f"{greeting}what you're describing is serious, and it is not your fault. "
                    "Your safety is the most important thing right now. "
                    "If you can, please move somewhere with other people — a neighbour's home, a shop, anywhere public. "
                    "Call 999 (police) or 1195 (GBV hotline) immediately if you are in danger. "
                    "Can you tell me — are you somewhere safe right now?"
                )

            hotlines = [
                {"name": "Kenya Police Emergency", "number": "999",          "type": "emergency"},
                {"name": "GVRC National Hotline",  "number": "1195",         "type": "hotline"},
                {"name": "Wangu Kanja Foundation", "number": "0711 200 400", "type": "organization"},
            ]

        # ── AMBER ─────────────────────────────────────────────────────────
        elif high_count >= 1 or med_count >= 2:
            risk = "amber"

            if language == "sw":
                empathy_sw = empathy_open or "Nakusikia, na ninajua hii si rahisi kuzungumza."
                reply = (
                    f"{empathy_sw} "
                    f"{greeting}unastahili kuishi bila woga. "
                    "Kinachoendelea nyumbani kwako si kawaida, hata kama imekuwa ikijirudia kwa muda mrefu. "
                    "Kuwa na mpango wa usalama kunaweza kukusaidia — kama vile mtu unayemwamini, "
                    "mahali unaweza kwenda haraka, na nambari za dharura zilizohifadhiwa. "
                    "Piga simu 1195 ili kuzungumza na mshauri aliyefunzwa wakati wowote. "
                    "Je, una mtu unayemwamini ambaye unaweza kumfikia?"
                )
            else:
                empathy_en = empathy_open or "I hear you, and I'm glad you felt you could share this with me."
                reply = (
                    f"{empathy_en} "
                    f"{greeting}you deserve to live without fear — what you're describing is not normal, "
                    "even if it has felt that way for a long time. "
                    "Having a safety plan can make a real difference: a trusted person you can call, "
                    "a place you can go quickly, and emergency numbers saved somewhere safe. "
                    "You can also call 1195 any time to speak with a trained counselor confidentially. "
                    "Is there someone in your life you trust enough to reach out to?"
                )

            hotlines = [
                {"name": "GVRC National Hotline",         "number": "1195",         "type": "hotline"},
                {"name": "Kituo cha Sheria (Legal Aid)",  "number": "0800 720 185", "type": "legal"},
            ]

        # ── GREEN ─────────────────────────────────────────────────────────
        else:
            risk = "green"

            if language == "sw":
                empathy_sw = empathy_open or "Asante kwa ujasiri wa kufikia — hii inahitaji moyo mkubwa."
                reply = (
                    f"{empathy_sw} "
                    f"{greeting}niko hapa kukusaidia bila kukuhukumu. "
                    "Hisia zako ni za kweli na zinastahili kusikizwa. "
                    "Unaweza kuchunguza rasilimali, kuzungumza na mtu, au tu kushiriki zaidi — "
                    "chochote unachohisi tayari kufanya. "
                    "Kumbuka: wewe si peke yako, na kinachotokea si kosa lako. "
                    "Ni nini kinachokusumbua zaidi sasa hivi?"
                )
            else:
                empathy_en = empathy_open or "Thank you for reaching out — it takes real courage to take this step."
                reply = (
                    f"{empathy_en} "
                    f"{greeting}I'm here to listen without any judgment. "
                    "Your feelings are valid, and you deserve to be heard. "
                    "We can explore support options together, or you can simply share more about what's been happening — "
                    "there's no pressure to do anything before you're ready. "
                    "Remember: you are not alone in this. "
                    "What's been weighing on you most?"
                )

            hotlines = [
                {"name": "GVRC National Hotline", "number": "1195", "type": "hotline"},
            ]

        return ChatResult(reply=reply, risk_level=risk, hotlines=hotlines)