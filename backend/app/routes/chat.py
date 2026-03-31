"""Chat endpoint connecting the frontend to the chat model and the database."""

import logging
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_chat_model
from ..models import Alert, Conversation, Message
from ..schemas import ChatRequest, ChatResponse
from ..services.claude import ClaudeClient
from ..database import get_db


router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)

# Note: This endpoint is intentionally simple for demo purposes. In a production app, consider more robust session management, error handling, and input validation.
@router.post("", response_model=ChatResponse)
async def chat(
	payload: ChatRequest,
	db: AsyncSession = Depends(get_db),
	chat_model: Any = Depends(get_chat_model),
):
	# Upsert conversation by session_id to keep history for admin view.
	existing = await db.execute(
		select(Conversation).where(Conversation.session_id == payload.session_id)
	)
	conversation = existing.scalar_one_or_none()
	if not conversation:
		conversation = Conversation(
			session_id=payload.session_id,
			language=payload.language,
			risk_level="green",
		)
		db.add(conversation)
		await db.flush()

	# Persist the user message
	db.add(
		Message(
			conversation_id=conversation.id,
			sender="user",
			content=payload.message,
		)
	)

	# Call the primary chat model; degrade to Claude stub on failure.
	try:
		result = await chat_model.generate(
			payload.message,
			payload.language,
			session_id=payload.session_id,
		)
	except Exception as exc:  # pragma: no cover - resilience path
		logger.exception("Primary chat model failed; using stub fallback.")
		fallback = ClaudeClient(api_key=None, model="stub")
		result = fallback._stub_response(payload.message, payload.language)

	# Persist assistant message and risk level update
	conversation.risk_level = result.risk_level
	if result.risk_level == "red":
		conversation.flagged = True
		alert = Alert(
			session_id=conversation.session_id,
			risk_level="red",
			message_preview=payload.message[:200],
		)
		db.add(alert)
	conversation.language = payload.language
	db.add(
		Message(
			conversation_id=conversation.id,
			sender="assistant",
			content=result.reply,
		)
	)

	await db.commit()

	return ChatResponse(
		reply=result.reply,
		risk_level=result.risk_level,
		hotlines=result.hotlines,
	)