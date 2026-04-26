"""
models.py — LIFELINE Database Models (Updated)
- 4-level risk classification (low/medium/high/critical)
- iv column on messages for AES-256-GCM encryption
- risk_score and explanation columns on alerts
- flagged column on conversations
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Float,
    ForeignKey, DateTime, JSON, Integer
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.sqlite import JSON as SQLITE_JSON

from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


# ── Conversations ──────────────────────────────────────────────────────────────
class Conversation(Base):
    __tablename__ = "conversations"

    id         = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(64), unique=True, nullable=False, index=True)
    language   = Column(String(4),  default="en")
    risk_level = Column(String(10), default="low")    # low | medium | high | critical
    flagged    = Column(Boolean,    default=False)     # True for high/critical
    created_at = Column(DateTime,   default=utcnow)

    messages   = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


# ── Messages ───────────────────────────────────────────────────────────────────
class Message(Base):
    __tablename__ = "messages"

    id              = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender          = Column(String(16), nullable=False)     # "user" | "assistant"
    content         = Column(Text,       nullable=False)     # AES-256-GCM encrypted (base64)
    iv              = Column(String(32), nullable=True)      # GCM nonce (base64) — null = unencrypted legacy
    created_at      = Column(DateTime,   default=utcnow)

    conversation    = relationship("Conversation", back_populates="messages")


# ── Resources ──────────────────────────────────────────────────────────────────
class Resource(Base):
    __tablename__ = "resources"

    id         = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name       = Column(String(255), nullable=False)
    number     = Column(String(64),  nullable=False)
    type       = Column(String(64),  nullable=False)     # hotline | shelter | legal | organization
    location   = Column(String(128), nullable=False, index=True)
    language   = Column(String(4),   default="en")
    latitude   = Column(Float,       nullable=True)      # for distance estimation
    longitude  = Column(Float,       nullable=True)
    created_at = Column(DateTime,    default=utcnow)

    __table_args__ = {"sqlite_autoincrement": False}


# ── Alerts ─────────────────────────────────────────────────────────────────────
class Alert(Base):
    __tablename__ = "alerts"

    id              = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id      = Column(String(64), nullable=False, index=True)
    risk_level      = Column(String(10), nullable=False)     # high | critical
    risk_score      = Column(Float,      nullable=True)      # 0.0-1.0
    message_preview = Column(String(200), nullable=True)     # first 200 chars, PII-redacted
    explanation     = Column(SQLITE_JSON, nullable=True)     # LIME explanation list
    acknowledged    = Column(Boolean,     default=False)
    created_at      = Column(DateTime,    default=utcnow)


# ── Counsellors ────────────────────────────────────────────────────────────────
class Counsellor(Base):
    __tablename__ = "counsellors"

    id             = Column(String(36),  primary_key=True, default=lambda: str(uuid.uuid4()))
    name           = Column(String(200), nullable=False)
    specialization = Column(String(200), nullable=True)
    organization   = Column(String(200), nullable=True)
    is_available   = Column(Boolean,     default=True)
    created_at     = Column(DateTime,    default=utcnow)

    requests       = relationship("CounsellorRequest", back_populates="counsellor", cascade="all, delete-orphan")


# ── Counsellor Requests ────────────────────────────────────────────────────────
class CounsellorRequest(Base):
    __tablename__ = "counsellor_requests"

    id             = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id     = Column(String(64), nullable=False, index=True)
    counsellor_id  = Column(String(36), ForeignKey("counsellors.id", ondelete="CASCADE"), nullable=False)
    status         = Column(String(20), default="pending")   # pending | accepted | closed
    created_at     = Column(DateTime,  default=utcnow)

    counsellor     = relationship("Counsellor", back_populates="requests")