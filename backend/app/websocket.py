"""
websocket.py — Real-time Socket.io messaging, threat detection, auto-destruct (FR-006, FR-007)
Implements:
  - Socket.io compatible WebSocket rooms per case
  - AES-256-GCM message encryption at rest
  - Real-time threat detection triggering alerts
  - Auto-destruct message scheduling via Celery
  - Counselor receives push notification on high/critical escalation
"""

import uuid
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional

import socketio
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, SessionLocal
from models import Message, Alert, Case, User
from encryption import encrypt_message, decrypt_message
from risk_engine import assess_risk
from auth import get_current_user

# ─── Socket.io server ─────────────────────────────────────────────────────────
# Use AsyncServer so it runs inside FastAPI's async loop
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",            # tighten in production
    logger=False,
    engineio_logger=False,
)

# Map: session_id → {"user_id": ..., "case_id": ...}
connected_clients: dict[str, dict] = {}


# ─── Socket.io event handlers ──────────────────────────────────────────────────
@sio.event
async def connect(sid, environ, auth):
    """Validate JWT on connect; join the case room."""
    token = (auth or {}).get("token")
    if not token:
        raise socketio.exceptions.ConnectionRefusedError("Authentication required")

    from auth import decode_token
    from models import DBSession as DBSessionModel

    try:
        payload = decode_token(token)
    except HTTPException:
        raise socketio.exceptions.ConnectionRefusedError("Invalid token")

    db: Session = SessionLocal()
    try:
        # Verify session not revoked
        jti = payload.get("jti")
        if jti and not db.query(DBSessionModel).filter_by(jti=jti, revoked=False).first():
            raise socketio.exceptions.ConnectionRefusedError("Session revoked")

        user_id = payload["sub"]
        case_id = (auth or {}).get("case_id")

        if case_id:
            # Verify user has access to this case
            case = db.query(Case).filter_by(id=case_id).first()
            if not case:
                raise socketio.exceptions.ConnectionRefusedError("Case not found")
            if str(case.survivor_id) != user_id and str(case.counselor_id) != user_id and payload["role"] != "admin":
                raise socketio.exceptions.ConnectionRefusedError("Access denied")
            await sio.enter_room(sid, f"case:{case_id}")

        connected_clients[sid] = {"user_id": user_id, "role": payload["role"], "case_id": case_id}
        await sio.emit("connected", {"status": "ok"}, to=sid)
    finally:
        db.close()


@sio.event
async def disconnect(sid):
    connected_clients.pop(sid, None)


@sio.event
async def send_message(sid, data):
    """
    data = {
        case_id: str,
        content: str,           # plaintext from client
        auto_destruct_minutes: int | null
    }
    Encrypts content, stores in DB, runs threat detection, broadcasts.
    """
    client = connected_clients.get(sid)
    if not client:
        return {"error": "Not authenticated"}

    case_id   = data.get("case_id")
    content   = data.get("content", "").strip()
    destruct_minutes = data.get("auto_destruct_minutes")

    if not case_id or not content:
        return {"error": "case_id and content required"}

    db: Session = SessionLocal()
    try:
        case = db.query(Case).filter_by(id=case_id).first()
        if not case:
            return {"error": "Case not found"}

        user_id = client["user_id"]
        if str(case.survivor_id) != user_id and str(case.counselor_id) != user_id and client["role"] != "admin":
            return {"error": "Access denied"}

        # AES-256-GCM encrypt
        ciphertext, iv = encrypt_message(content)

        # Auto-destruct timestamp
        destruct_at = None
        if destruct_minutes and isinstance(destruct_minutes, int) and destruct_minutes > 0:
            destruct_at = datetime.now(timezone.utc) + timedelta(minutes=destruct_minutes)

        msg = Message(
            id=uuid.uuid4(),
            case_id=case_id,
            sender_id=user_id,
            ciphertext=ciphertext,
            iv=iv,
            auto_destruct_at=destruct_at,
        )
        db.add(msg)
        db.flush()

        # ── Threat detection (FR-007) ──────────────────────────────────────
        # Run risk assessment on each message for real-time monitoring
        if client["role"] == "survivor":
            result = await asyncio.get_event_loop().run_in_executor(
                None, _sync_risk_assess, content, str(case.id)
            )
            risk_level  = result.get("risk_level", "low")
            risk_score  = result.get("confidence", 0.0)
            explanation = result.get("explanation", {})

            # Escalate case risk if higher than current
            risk_order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
            if risk_order.get(risk_level, 0) > risk_order.get(case.risk_level, 0):
                case.risk_level = risk_level
                case.is_flagged = risk_level in ("high", "critical")

            # Create alert for high/critical
            if risk_level in ("high", "critical"):
                alert = Alert(
                    id=uuid.uuid4(),
                    case_id=case_id,
                    risk_level=risk_level,
                    trigger_text=content[:500],
                    risk_score=risk_score,
                    explanation=explanation,
                )
                db.add(alert)

                # Notify counselor in real time
                await sio.emit(
                    "threat_alert",
                    {
                        "case_id": case_id,
                        "risk_level": risk_level,
                        "risk_score": risk_score,
                        "message": "⚠ Elevated risk detected in this conversation",
                    },
                    room=f"case:{case_id}",
                )

        db.commit()

        # Schedule Celery auto-destruct task if needed
        if destruct_at:
            from backend.app.tasks import schedule_message_destruct
            schedule_message_destruct.apply_async(
                args=[str(msg.id)],
                eta=destruct_at,
            )

        # Broadcast plaintext to room members (decrypted for display only in-memory)
        broadcast_payload = {
            "id": str(msg.id),
            "case_id": case_id,
            "sender_id": user_id,
            "sender_role": client["role"],
            "content": content,                   # in-memory plaintext; not re-stored
            "auto_destruct_at": destruct_at.isoformat() if destruct_at else None,
            "created_at": msg.created_at.isoformat(),
        }
        await sio.emit("message", broadcast_payload, room=f"case:{case_id}")
        return {"ok": True, "message_id": str(msg.id)}

    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@sio.event
async def mark_read(sid, data):
    """Mark all messages in a case as read for the current user."""
    client = connected_clients.get(sid)
    if not client:
        return
    case_id = data.get("case_id")
    if not case_id:
        return
    db: Session = SessionLocal()
    try:
        db.query(Message).filter_by(case_id=case_id, is_read=False).update({"is_read": True})
        db.commit()
    finally:
        db.close()


# ─── Sync wrapper for the async risk engine ───────────────────────────────────
def _sync_risk_assess(text: str, case_id: str) -> dict:
    """Called in executor to avoid blocking the event loop."""
    try:
        import asyncio as _asyncio
        loop = _asyncio.new_event_loop()
        result = loop.run_until_complete(assess_risk(text))
        loop.close()
        return result
    except Exception:
        return {"risk_level": "low", "confidence": 0.0, "explanation": {}}


# ─── REST fallback for message history ────────────────────────────────────────
rest_router = APIRouter(prefix="/messages", tags=["Messages"])


class MessageHistoryOut(BaseModel):
    id: str
    sender_id: Optional[str]
    sender_role: Optional[str]
    content: str
    auto_destruct_at: Optional[str]
    created_at: str


@rest_router.get("/{case_id}", response_model=list[MessageHistoryOut])
def get_message_history(
    case_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve and decrypt message history for a case."""
    case = db.query(Case).filter_by(id=case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    if str(case.survivor_id) != str(user.id) and str(case.counselor_id) != str(user.id) and user.role != "admin":
        raise HTTPException(403, "Access denied")

    # Auto-delete expired messages
    now = datetime.now(timezone.utc)
    db.query(Message).filter(
        Message.case_id == case_id,
        Message.auto_destruct_at != None,
        Message.auto_destruct_at <= now,
    ).delete()
    db.commit()

    messages = db.query(Message).filter_by(case_id=case_id).order_by(Message.created_at).all()

    out = []
    for m in messages:
        try:
            content = decrypt_message(m.ciphertext, m.iv)
        except Exception:
            content = "[Message could not be decrypted]"

        sender = db.query(User).filter_by(id=m.sender_id).first() if m.sender_id else None
        out.append(MessageHistoryOut(
            id=str(m.id),
            sender_id=str(m.sender_id) if m.sender_id else None,
            sender_role=sender.role if sender else None,
            content=content,
            auto_destruct_at=m.auto_destruct_at.isoformat() if m.auto_destruct_at else None,
            created_at=m.created_at.isoformat(),
        ))
    return out