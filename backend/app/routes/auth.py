"""
auth.py — LIFELINE Authentication Service
JWT tokens with expiry + TOTP-based MFA for admin login
"""

import os
import time
import hmac
import base64
import struct
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from passlib.context import CryptContext

# ── Configuration ──────────────────────────────────────────────────────────────
JWT_SECRET      = os.getenv("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM   = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Admin credentials from env
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "")  # bcrypt hash
ADMIN_TOTP_SECRET   = os.getenv("ADMIN_TOTP_SECRET", "")    # base32 TOTP secret

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Password utilities ─────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    # Also allow plaintext comparison for ADMIN_PASSWORD env var fallback
    admin_plain = os.getenv("ADMIN_PASSWORD", "changeme")
    if not hashed:
        return secrets.compare_digest(plain, admin_plain)
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return secrets.compare_digest(plain, admin_plain)


# ── JWT utilities ──────────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None   # token expired
    except jwt.InvalidTokenError:
        return None


def is_token_valid(token: str) -> bool:
    return decode_access_token(token) is not None


# ── TOTP implementation (RFC 6238) ─────────────────────────────────────────────
def _hotp(key_bytes: bytes, counter: int) -> int:
    """HMAC-based One-Time Password."""
    msg = struct.pack(">Q", counter)
    h   = hmac.new(key_bytes, msg, hashlib.sha1).digest()
    offset = h[-1] & 0x0F
    code   = struct.unpack(">I", h[offset:offset+4])[0] & 0x7FFFFFFF
    return code % 1_000_000


def generate_totp(secret_b32: str, window: int = 0) -> str:
    """Generate current TOTP code (30-second window)."""
    try:
        # Pad base32 if needed
        padded = secret_b32.upper() + "=" * ((8 - len(secret_b32) % 8) % 8)
        key    = base64.b32decode(padded)
        counter = int(time.time()) // 30 + window
        return str(_hotp(key, counter)).zfill(6)
    except Exception:
        return "000000"


def verify_totp(secret_b32: str, code: str) -> bool:
    """Verify TOTP code allowing ±1 window (90-second tolerance)."""
    if not secret_b32:
        # TOTP not configured — skip MFA check (dev mode)
        return True
    code = code.strip().replace(" ", "")
    for w in [-1, 0, 1]:
        if secrets.compare_digest(generate_totp(secret_b32, w), code):
            return True
    return False


def generate_totp_secret() -> str:
    """Generate a new base32 TOTP secret (for setup)."""
    raw = secrets.token_bytes(20)
    return base64.b32encode(raw).decode().rstrip("=")


def get_totp_uri(secret: str, account: str = "admin", issuer: str = "LIFELINE") -> str:
    """Get otpauth URI for QR code generation."""
    padded = secret.upper() + "=" * ((8 - len(secret) % 8) % 8)
    return f"otpauth://totp/{issuer}:{account}?secret={padded}&issuer={issuer}&algorithm=SHA1&digits=6&period=30"


# ── FastAPI dependency ─────────────────────────────────────────────────────────
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

bearer_scheme = HTTPBearer(auto_error=False)

async def require_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
) -> dict:
    """FastAPI dependency — validates JWT Bearer token."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    if payload is None or payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload