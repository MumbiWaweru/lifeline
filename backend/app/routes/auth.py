"""
auth.py — Full RBAC authentication module
Covers FR-001 (registration + email verification), FR-002 (Survivor/Counselor/Admin roles),
FR-010 (TOTP MFA for all roles), account lockout, JWT with JTI tracking.
"""

import os
import hmac
import hashlib
import struct
import time
import base64
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from models import User, AuditLog, DBSession

# ─── Config ────────────────────────────────────────────────────────────────────
JWT_SECRET       = os.environ.get("JWT_SECRET", secrets.token_urlsafe(32))
JWT_ALGORITHM    = "HS256"
JWT_EXPIRY_MINS  = 60
TOTP_WINDOW      = 1          # allow ±1 time step (30 s each)
MAX_LOGIN_FAILS  = 5
LOCKOUT_MINS     = 15

bearer_scheme = HTTPBearer(auto_error=False)


# ─── Pydantic schemas ──────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: Optional[EmailStr] = None      # None = anonymous survivor
    password: str
    role: str = "survivor"                # survivor | counselor | admin
    display_name: Optional[str] = None
    language: str = "en"
    is_anonymous: bool = False

class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    password: str
    totp_code: Optional[str] = None       # required when TOTP is enabled

class VerifyEmailRequest(BaseModel):
    token: str

class SetupTOTPRequest(BaseModel):
    confirm_code: str                     # must verify before activating

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ─── TOTP (RFC 6238) — pure stdlib, no pyotp dependency ───────────────────────
def _hotp(secret_b32: str, counter: int) -> int:
    key = base64.b32decode(secret_b32.upper())
    msg = struct.pack(">Q", counter)
    mac = hmac.new(key, msg, hashlib.sha1).digest()
    offset = mac[-1] & 0x0F
    code   = struct.unpack(">I", mac[offset:offset + 4])[0] & 0x7FFFFFFF
    return code % 1_000_000


def generate_totp_secret() -> str:
    """Return a random base32 secret suitable for authenticator apps."""
    raw = secrets.token_bytes(20)
    return base64.b32encode(raw).decode()


def get_totp_uri(secret: str, email: str) -> str:
    return (
        f"otpauth://totp/LIFELINE:{email}"
        f"?secret={secret}&issuer=LIFELINE&algorithm=SHA1&digits=6&period=30"
    )


def verify_totp(secret: str, code: str) -> bool:
    """Allow ±TOTP_WINDOW 30-second windows to handle clock skew."""
    try:
        code_int = int(code)
    except (ValueError, TypeError):
        return False
    counter = int(time.time()) // 30
    for delta in range(-TOTP_WINDOW, TOTP_WINDOW + 1):
        if _hotp(secret, counter + delta) == code_int:
            return True
    return False


# ─── Password helpers ──────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


def check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _validate_password_strength(password: str):
    if len(password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")


# ─── JWT helpers ───────────────────────────────────────────────────────────────
def create_access_token(user: User) -> str:
    jti = str(uuid.uuid4())
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "email": user.email,
        "jti": jti,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRY_MINS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")


# ─── FastAPI dependencies ──────────────────────────────────────────────────────
def _get_current_user_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> dict:
    if not credentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    payload = decode_token(credentials.credentials)
    # Check token hasn't been revoked in DB
    jti = payload.get("jti")
    if jti:
        session = db.query(DBSession).filter_by(jti=jti, revoked=False).first()
        if not session:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session revoked")
    return payload


def get_current_user(
    payload: dict = Depends(_get_current_user_payload),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter_by(id=payload["sub"]).first()
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


def require_role(*roles: str):
    """Factory for role-gated dependencies."""
    def _checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return user
    return _checker

require_admin     = require_role("admin")
require_counselor = require_role("counselor", "admin")
require_survivor  = require_role("survivor", "counselor", "admin")


# ─── Account lockout helper ────────────────────────────────────────────────────
def _check_lockout(user: User):
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        remaining = int((user.locked_until - datetime.now(timezone.utc)).total_seconds() // 60) + 1
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Account locked. Try again in {remaining} minute(s)."
        )


def _record_failed_login(user: User, db: Session):
    user.failed_login_count += 1
    if user.failed_login_count >= MAX_LOGIN_FAILS:
        user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINS)
    db.commit()


def _reset_failed_login(user: User, db: Session):
    user.failed_login_count = 0
    user.locked_until = None
    user.last_login = datetime.now(timezone.utc)
    db.commit()


# ─── Email verification helper ─────────────────────────────────────────────────
def _send_verification_email(email: str, token: str):
    """
    In production: integrate with SendGrid / AWS SES.
    For now: log to console (swap for real implementation).
    """
    verify_url = f"{os.environ.get('FRONTEND_URL','http://localhost:5173')}/verify-email?token={token}"
    print(f"[EMAIL] Verification link for {email}: {verify_url}")


# ─── Router ────────────────────────────────────────────────────────────────────
from fastapi import APIRouter
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Anonymous survivor shortcut — no email needed
    if req.is_anonymous or req.role == "survivor" and not req.email:
        _validate_password_strength(req.password)
        user = User(
            id=uuid.uuid4(),
            role="survivor",
            is_anonymous=True,
            email_verified=True,          # no email to verify
            password_hash=hash_password(req.password),
            language=req.language,
        )
        db.add(user)
        db.commit()
        token = create_access_token(user)
        _store_session(user, token, db)
        return {"access_token": token, "token_type": "bearer", "role": user.role}

    # Named registration (counselors always require email)
    if not req.email:
        raise HTTPException(400, "Email required for counselor/admin registration")
    if db.query(User).filter_by(email=req.email).first():
        raise HTTPException(409, "Email already registered")

    _validate_password_strength(req.password)
    verify_token = secrets.token_urlsafe(32)

    user = User(
        id=uuid.uuid4(),
        email=req.email,
        password_hash=hash_password(req.password),
        role=req.role,
        is_anonymous=False,
        display_name=req.display_name,
        language=req.language,
        email_verified=False,
        email_verify_token=verify_token,
        email_verify_expiry=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(user)
    db.commit()
    _send_verification_email(req.email, verify_token)
    return {"message": "Registration successful. Please check your email to verify your account."}


@router.post("/verify-email")
def verify_email(req: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email_verify_token=req.token).first()
    if not user:
        raise HTTPException(400, "Invalid or expired verification token")
    if user.email_verify_expiry < datetime.now(timezone.utc):
        raise HTTPException(400, "Verification token has expired. Please register again.")
    user.email_verified    = True
    user.email_verify_token = None
    user.email_verify_expiry = None
    db.commit()
    return {"message": "Email verified successfully. You may now log in."}


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    if not req.email:
        raise HTTPException(400, "Email required for login")

    user = db.query(User).filter_by(email=req.email).first()
    if not user or not check_password(req.password, user.password_hash):
        if user:
            _record_failed_login(user, db)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    _check_lockout(user)

    if not user.email_verified:
        raise HTTPException(403, "Please verify your email before logging in")

    # TOTP check — required for ALL roles when enabled (FR-010)
    if user.totp_enabled:
        if not req.totp_code:
            return {"mfa_required": True, "message": "Please provide your TOTP code"}
        if not verify_totp(user.totp_secret, req.totp_code):
            _record_failed_login(user, db)
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid TOTP code")

    _reset_failed_login(user, db)
    token = create_access_token(user)
    _store_session(user, token, db)

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "totp_enabled": user.totp_enabled,
        "display_name": user.display_name,
    }


@router.post("/setup-totp")
def setup_totp(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Step 1: generate a TOTP secret and return the QR URI."""
    secret = generate_totp_secret()
    user.totp_secret = secret         # not yet activated
    db.commit()
    email_label = user.email or f"anon-{str(user.id)[:8]}"
    return {
        "secret": secret,
        "uri": get_totp_uri(secret, email_label),
        "message": "Scan the QR code in your authenticator app, then call /auth/confirm-totp"
    }


@router.post("/confirm-totp")
def confirm_totp(req: SetupTOTPRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Step 2: confirm with a live code to activate TOTP."""
    if not user.totp_secret:
        raise HTTPException(400, "Call /auth/setup-totp first")
    if not verify_totp(user.totp_secret, req.confirm_code):
        raise HTTPException(400, "Invalid TOTP code — check your authenticator app clock")
    user.totp_enabled = True
    db.commit()
    return {"message": "TOTP multi-factor authentication enabled successfully"}


@router.post("/logout")
def logout(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    if credentials:
        try:
            payload = decode_token(credentials.credentials)
            jti = payload.get("jti")
            if jti:
                session = db.query(DBSession).filter_by(jti=jti).first()
                if session:
                    session.revoked = True
                    db.commit()
        except Exception:
            pass
    return {"message": "Logged out successfully"}


@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not check_password(req.current_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    _validate_password_strength(req.new_password)
    user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


# ─── Internal helper ───────────────────────────────────────────────────────────
def _store_session(user: User, token: str, db: Session):
    payload = decode_token(token)
    session = DBSession(
        id=uuid.uuid4(),
        user_id=user.id,
        jti=payload["jti"],
        expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
    )
    db.add(session)
    db.commit()