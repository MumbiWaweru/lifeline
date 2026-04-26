"""
chat.py — LIFELINE Chat Route (Updated)
- OpenRouter/Claude AI risk assessment (4-level)
- LIME-style per-phrase explanation scores
- AES-256-GCM message encryption at rest
- Automatic escalation for critical/high cases
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models   import Conversation, Message, Alert

from app.services.risk_engine import assess_risk, generate_response, redact_pii_from_text
from app.services.encryption  import encrypt_message, redact_pii

router = APIRouter(tags=["chat"])

# Resource hotlines by risk level (Kenya-specific)
HOTLINES = {
    "critical": [
        {"name": "Emergency Services",      "number": "999",          "type": "emergency"},
        {"name": "GBV National Hotline",    "number": "1195",         "type": "hotline"},
        {"name": "Kenya Police",            "number": "0800 722 203", "type": "police"},
    ],
    "high": [
        {"name": "GBV National Hotline",    "number": "1195",         "type": "hotline"},
        {"name": "FIDA Kenya",              "number": "0719 638 006", "type": "legal"},
        {"name": "Wangu Kanja Foundation",  "number": "0721 345 678", "type": "support"},
    ],
    "medium": [
        {"name": "GBV National Hotline",    "number": "1195",         "type": "hotline"},
        {"name": "Kituo cha Sheria",        "number": "0800 720 765", "type": "legal"},
    ],
    "low": [
        {"name": "GBV National Hotline",    "number": "1195",         "type": "hotline"},
    ],
}

# Thresholds for auto-flagging and alert creation
FLAG_LEVELS = {"high", "critical"}


# ── Schemas ────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    session_id: Optional[str] = None
    name: Optional[str] = None


class ExplanationItem(BaseModel):
    phrase: str
    score: float
    label: str


class ChatResponse(BaseModel):
    reply: str
    risk_level: str                        # low | medium | high | critical
    risk_score: float
    confidence: float
    explanation: list[ExplanationItem]     # LIME-style per-phrase scores
    hotlines: list[dict]
    session_id: str
    escalated: bool = False               # True if counselor was auto-assigned


# ── Endpoint ───────────────────────────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, db: AsyncSession = Depends(get_db)):
    session_id = body.session_id or f"sess_{uuid.uuid4().hex[:16]}"
    text       = body.message.strip()

    if not text:
        raise HTTPException(status_code=422, detail="Message cannot be empty")

    # 1. Redact PII before any analysis or storage
    clean_text = redact_pii(text)

    # 2. Get or create conversation record
    result = await db.execute(
        select(Conversation).where(Conversation.session_id == session_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        conv = Conversation(
            session_id=session_id,
            language=body.language,
            risk_level="low",
        )
        db.add(conv)
        await db.flush()

    # 3. Fetch conversation history for context
    hist_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.desc())
        .limit(8)
    )
    history_msgs = list(reversed(hist_result.scalars().all()))

    from app.services.encryption import decrypt_message
    history = []
    for m in history_msgs:
        try:
            content = decrypt_message(m.content, m.iv) if m.iv else m.content
        except Exception:
            content = ""
        role = "user" if m.sender == "user" else "assistant"
        history.append({"role": role, "content": content})

    # 4. AI risk assessment
    risk_result = await assess_risk(clean_text, body.language)
    risk_level  = risk_result["risk_level"]
    risk_score  = risk_result.get("risk_score",  0.5)
    confidence  = risk_result.get("confidence",  0.8)
    explanation = risk_result.get("explanation", [])

    # 5. Generate trauma-informed response
    reply = await generate_response(
        text=clean_text,
        risk_result=risk_result,
        conversation_history=history,
        language=body.language,
        name=body.name,
    )

    # 6. Store user message (encrypted)
    user_ct, user_iv = encrypt_message(clean_text)
    user_msg = Message(
        conversation_id=conv.id,
        sender="user",
        content=user_ct,
        iv=user_iv,
    )
    db.add(user_msg)

    # 7. Store assistant reply (encrypted)
    bot_ct, bot_iv = encrypt_message(reply)
    bot_msg = Message(
        conversation_id=conv.id,
        sender="assistant",
        content=bot_ct,
        iv=bot_iv,
    )
    db.add(bot_msg)

    # 8. Update conversation risk level (escalate, never de-escalate in same session)
    level_order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
    current_order = level_order.get(conv.risk_level, 0)
    new_order     = level_order.get(risk_level, 0)
    if new_order > current_order:
        conv.risk_level = risk_level

    # 9. Flag conversation and create alert for high/critical
    escalated = False
    if risk_level in FLAG_LEVELS:
        conv.flagged = True
        # Create alert record
        alert = Alert(
            session_id=session_id,
            risk_level=risk_level,
            risk_score=risk_score,
            message_preview=clean_text[:200],
            explanation=explanation,
            acknowledged=False,
        )
        db.add(alert)
        escalated = True

    await db.commit()

    return ChatResponse(
        reply=reply,
        risk_level=risk_level,
        risk_score=round(risk_score, 3),
        confidence=round(confidence, 3),
        explanation=[ExplanationItem(**e) for e in explanation],
        hotlines=HOTLINES.get(risk_level, HOTLINES["low"]),
        session_id=session_id,
        escalated=escalated,
    )