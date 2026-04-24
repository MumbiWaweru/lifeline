"""Chat endpoint connecting the frontend to Gemini and the database."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_gemini_client
from ..models import Conversation, Message
from ..schemas import ChatRequest, ChatResponse
from ..services.gemini import GeminiClient
from ..database import get_db


router = APIRouter(prefix="/chat", tags=["chat"])

# Note: This endpoint is intentionally simple for demo purposes. In a production app, consider more robust session management, error handling, and input validation.
@router.post("", response_model=ChatResponse)
async def chat(
	payload: ChatRequest,
	db: AsyncSession = Depends(get_db),
	gemini: GeminiClient = Depends(get_gemini_client),
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

	# Call Gemini for a reply + risk assessment
	try:
		result = await gemini.generate(payload.message, payload.language, payload.name)
	except Exception as exc:  # pragma: no cover - demo resilience
		raise HTTPException(
			status_code=status.HTTP_502_BAD_GATEWAY,
			detail="Chat service unavailable",
		) from exc

	# Persist assistant message and risk level update
	conversation.risk_level = result.risk_level
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
