"""
encryption.py — LIFELINE AES-256-GCM Encryption Service
Encrypts message content before storing in database.
Each message gets a unique random IV (96-bit nonce).
"""

import os
import base64
import secrets
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# ── Key management ─────────────────────────────────────────────────────────────
# In production: load from a KMS or Vault. For now: env variable (32 bytes = 256 bits)
_raw_key_env = os.getenv("MESSAGE_ENCRYPTION_KEY", "")

def _get_key() -> bytes:
    """Return the 256-bit AES key, generating one if not configured."""
    if _raw_key_env:
        # Accept hex-encoded key from env
        try:
            key = bytes.fromhex(_raw_key_env)
            if len(key) == 32:
                return key
        except ValueError:
            pass
        # Try base64-encoded
        try:
            key = base64.b64decode(_raw_key_env)
            if len(key) == 32:
                return key
        except Exception:
            pass
    # Derive a deterministic key from JWT_SECRET so it survives restarts
    import hashlib
    jwt_secret = os.getenv("JWT_SECRET", "lifeline-default-secret-change-in-production")
    return hashlib.sha256(jwt_secret.encode()).digest()   # 32 bytes


# ── Encrypt / Decrypt ──────────────────────────────────────────────────────────
def encrypt_message(plaintext: str) -> tuple[str, str]:
    """
    Encrypt a plaintext string using AES-256-GCM.

    Returns:
        (ciphertext_b64, iv_b64) — both base64-encoded strings safe for DB storage.
    """
    key  = _get_key()
    iv   = secrets.token_bytes(12)           # 96-bit nonce (GCM standard)
    aesgcm = AESGCM(key)
    ct   = aesgcm.encrypt(iv, plaintext.encode("utf-8"), None)   # no AAD for simplicity
    return base64.b64encode(ct).decode(), base64.b64encode(iv).decode()


def decrypt_message(ciphertext_b64: str, iv_b64: str) -> str:
    """
    Decrypt a base64-encoded AES-256-GCM ciphertext.

    Returns:
        Decrypted plaintext string.
    Raises:
        ValueError if decryption fails (tampered data).
    """
    key  = _get_key()
    iv   = base64.b64decode(iv_b64)
    ct   = base64.b64decode(ciphertext_b64)
    aesgcm = AESGCM(key)
    try:
        plain = aesgcm.decrypt(iv, ct, None)
        return plain.decode("utf-8")
    except Exception as e:
        raise ValueError(f"Decryption failed — data may be tampered: {e}")


def encrypt_if_not_none(text: str | None) -> tuple[str | None, str | None]:
    """Helper: encrypt only if text is not None."""
    if text is None:
        return None, None
    return encrypt_message(text)


# ── PII Redaction (for anonymisation before storage) ──────────────────────────
import re

_PII_PATTERNS = [
    # Kenyan phone numbers
    (re.compile(r"\b(07\d{2}[\s-]?\d{3}[\s-]?\d{3}|01\d{2}[\s-]?\d{3}[\s-]?\d{3}|\+254\d{9})\b"), "[PHONE]"),
    # Email addresses
    (re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"), "[EMAIL]"),
    # National ID (Kenya: 8 digits)
    (re.compile(r"\b\d{8}\b"), "[ID_NUMBER]"),
    # Physical addresses (heuristic: "at [Place]", "in [Place]" with capitalisation)
    # Note: We keep location info for resource matching, so only redact street-level detail
    (re.compile(r"\b\d+\s+[A-Z][a-z]+\s+(Street|Road|Avenue|Lane|Close|Drive|Rd|St)\b"), "[ADDRESS]"),
]

def redact_pii(text: str) -> str:
    """Remove personally identifiable information from text before analysis."""
    for pattern, replacement in _PII_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


# ── Utility: generate a new key for setup ─────────────────────────────────────
def generate_encryption_key() -> str:
    """Generate a new random AES-256 key (hex-encoded) for environment setup."""
    return secrets.token_bytes(32).hex()


if __name__ == "__main__":
    # Quick self-test
    ct, iv = encrypt_message("Hello, this is a test message.")
    print(f"Encrypted: {ct[:30]}...")
    print(f"IV: {iv}")
    plain = decrypt_message(ct, iv)
    print(f"Decrypted: {plain}")
    print("✅ Encryption self-test passed")
    print(f"\nSample encryption key for .env:\nMESSAGE_ENCRYPTION_KEY={generate_encryption_key()}")