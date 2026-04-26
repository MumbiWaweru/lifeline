"""
admin.py — LIFELINE Admin Routes (Updated)
JWT authentication + TOTP MFA replacing the static demo token.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional

from app.database   import get_db
from app.models     import Conversation, Message, Alert, Counsellor, CounsellorRequest
from app.services.auth import (
    verify_password, verify_totp, create_access_token,
    require_admin, ADMIN_TOTP_SECRET, get_totp_uri, generate_totp_secret,
)

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Schemas ────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    password: str
    totp_code: Optional[str] = None   # Required when TOTP is configured


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 3600           # seconds
    mfa_required: bool = False
    totp_setup_uri: Optional[str] = None   # Only returned on first-time setup


# ── Auth endpoints ─────────────────────────────────────────────────────────────
@router.post("/login", response_model=LoginResponse)
async def admin_login(body: LoginRequest):
    """
    Admin login with password + optional TOTP code.
    Returns a signed JWT valid for 60 minutes.
    """
    # 1. Verify password
    if not verify_password(body.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # 2. Verify TOTP if configured
    if ADMIN_TOTP_SECRET:
        if not body.totp_code:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="MFA code required",
                headers={"X-MFA-Required": "true"},
            )
        if not verify_totp(ADMIN_TOTP_SECRET, body.totp_code):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid MFA code",
            )

    # 3. Issue JWT
    token = create_access_token({"sub": "admin", "role": "admin"})

    return LoginResponse(
        access_token=token,
        mfa_required=bool(ADMIN_TOTP_SECRET),
    )


@router.get("/totp/setup")
async def totp_setup():
    """
    Returns a new TOTP secret + QR URI for first-time MFA setup.
    In production, protect this endpoint or run it once during deployment.
    """
    secret = generate_totp_secret()
    uri    = get_totp_uri(secret)
    return {
        "secret": secret,
        "otpauth_uri": uri,
        "instructions": (
            "1. Set ADMIN_TOTP_SECRET in your .env file to the secret above. "
            "2. Scan the otpauth_uri with Google Authenticator or Authy. "
            "3. Restart the backend. Future logins will require the TOTP code."
        ),
    }


# ── Dashboard endpoints (all require valid JWT) ────────────────────────────────
@router.get("/stats")
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    _admin: dict    = Depends(require_admin),
):
    """Aggregate conversation statistics by risk level."""
    rows = await db.execute(
        select(Conversation.risk_level, func.count(Conversation.id))
        .group_by(Conversation.risk_level)
    )
    counts = {row[0]: row[1] for row in rows}
    total  = sum(counts.values())

    return {
        "total":    total,
        "low":      counts.get("low",      0),
        "medium":   counts.get("medium",   0),
        "high":     counts.get("high",     0),
        "critical": counts.get("critical", 0),
        # Legacy support for old frontend expecting green/amber/red
        "green":    counts.get("low",      0),
        "amber":    counts.get("medium",   0) + counts.get("high", 0),
        "red":      counts.get("critical", 0),
    }


@router.get("/conversations")
async def list_conversations(
    flagged: Optional[bool] = None,
    risk_level: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _admin: dict    = Depends(require_admin),
):
    """List conversations with optional filters."""
    q = select(Conversation).order_by(Conversation.created_at.desc()).limit(limit)

    if flagged is not None:
        q = q.where(Conversation.flagged == flagged)
    if risk_level:
        q = q.where(Conversation.risk_level == risk_level)

    result = await db.execute(q)
    convs  = result.scalars().all()

    output = []
    for c in convs:
        msgs_result = await db.execute(
            select(Message).where(Message.conversation_id == c.id)
            .order_by(Message.created_at)
        )
        msgs = msgs_result.scalars().all()

        # Decrypt messages for admin view
        from app.services.encryption import decrypt_message
        decrypted_msgs = []
        for m in msgs:
            try:
                content = (
                    decrypt_message(m.content, m.iv)
                    if m.iv else m.content
                )
            except Exception:
                content = "[encrypted — decryption failed]"
            decrypted_msgs.append({
                "sender":    m.sender,
                "content":   content,
                "timestamp": m.created_at.isoformat(),
            })

        output.append({
            "id":         str(c.id),
            "session_id": c.session_id,
            "risk_level": c.risk_level,
            "language":   c.language,
            "flagged":    getattr(c, "flagged", False),
            "timestamp":  c.created_at.isoformat(),
            "messages":   decrypted_msgs,
        })

    return {"conversations": output}


@router.get("/alerts")
async def list_alerts(
    db: AsyncSession = Depends(get_db),
    _admin: dict    = Depends(require_admin),
):
    """List high-risk alerts requiring admin attention."""
    result = await db.execute(
        select(Alert).order_by(Alert.created_at.desc()).limit(100)
    )
    alerts = result.scalars().all()

    return {
        "alerts": [
            {
                "id":          str(a.id),
                "session_id":  a.session_id,
                "risk_level":  a.risk_level,
                "risk_score":  getattr(a, "risk_score", None),
                "preview":     a.message_preview,
                "explanation": getattr(a, "explanation", []),
                "created_at":  a.created_at.isoformat(),
                "acknowledged": getattr(a, "acknowledged", False),
            }
            for a in alerts
        ]
    }


@router.patch("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict    = Depends(require_admin),
):
    """Mark an alert as acknowledged."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert  = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.acknowledged = True
    await db.commit()
    return {"status": "acknowledged"}


# ── Counsellor management ──────────────────────────────────────────────────────
@router.get("/counsellors")
async def list_counsellors(
    db: AsyncSession = Depends(get_db),
    _admin: dict    = Depends(require_admin),
):
    result = await db.execute(select(Counsellor).order_by(Counsellor.created_at.desc()))
    counsellors = result.scalars().all()
    return {
        "counsellors": [
            {
                "id":           str(c.id),
                "name":         c.name,
                "specialization": c.specialization,
                "organization": c.organization,
                "is_available": c.is_available,
                "created_at":   c.created_at.isoformat(),
            }
            for c in counsellors
        ]
    }


@router.get("/requests")
async def list_requests(
    db: AsyncSession = Depends(get_db),
    _admin: dict    = Depends(require_admin),
):
    result = await db.execute(
        select(CounsellorRequest).order_by(CounsellorRequest.created_at.desc())
    )
    requests = result.scalars().all()
    return {
        "requests": [
            {
                "id":           str(r.id),
                "session_id":   r.session_id,
                "counsellor_id": str(r.counsellor_id),
                "status":       r.status,
                "created_at":   r.created_at.isoformat(),
            }
            for r in requests
        ]
    }