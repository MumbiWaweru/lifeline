"""Database models for conversations, messages, and resources."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

class Conversation(Base):
	__tablename__ = "conversations"

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
	)
	session_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
	language: Mapped[str] = mapped_column(String(4), default="en")
	risk_level: Mapped[str] = mapped_column(String(10), default="green")
	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), default=datetime.utcnow
	)

	messages: Mapped[list["Message"]] = relationship(
		"Message", back_populates="conversation", cascade="all, delete-orphan"
	)


class Message(Base):
	__tablename__ = "messages"

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
	)
	conversation_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE")
	)
	sender: Mapped[str] = mapped_column(String(16))  # "user" or "assistant"
	content: Mapped[str] = mapped_column(Text)
	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), default=datetime.utcnow
	)

	conversation: Mapped[Conversation] = relationship("Conversation", back_populates="messages")


class Resource(Base):
	__tablename__ = "resources"
	__table_args__ = (
		UniqueConstraint("name", "location", name="uq_resource_name_location"),
	)

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
	)
	name: Mapped[str] = mapped_column(String(255))
	number: Mapped[str] = mapped_column(String(64))
	type: Mapped[str] = mapped_column(String(64))  # e.g., hotline, shelter, legal
	location: Mapped[str] = mapped_column(String(128), index=True)
	language: Mapped[str] = mapped_column(String(4), default="en")

	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), default=datetime.utcnow
	)
