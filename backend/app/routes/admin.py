"""Admin endpoints: login, list conversations, basic stats."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..config import get_settings
from ..database import get_db
from ..dependencies import require_admin
from ..models import Alert, Conversation
from fastapi import Query
from ..schemas import (
	AdminLoginRequest,
	AdminLoginResponse,
	ConversationMessage,
	ConversationOut,
	ConversationsResponse,
	AlertOut,
	AlertsResponse,
	StatsResponse,
)


router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(payload: AdminLoginRequest):
	# Simple password check with a static token; adequate for demo purposes only.
	settings = get_settings()
	if payload.password != settings.admin_password:
		return AdminLoginResponse(token="")
	return AdminLoginResponse(token=settings.admin_token)


@router.get("/conversations", response_model=ConversationsResponse, dependencies=[Depends(require_admin)])
async def list_conversations(
	flagged_only: bool = Query(False, description="Filter only flagged conversations"),
	db: AsyncSession = Depends(get_db)
):
	# Eager-load messages so the admin dashboard can render threads efficiently.
	stmt = select(Conversation).options(selectinload(Conversation.messages)).order_by(
		Conversation.created_at.desc()
	)
	if flagged_only:
		stmt = stmt.where(Conversation.flagged == True)
	conversations = (await db.execute(stmt)).scalars().all()

	payload = []
	for conv in conversations:
		payload.append(
			ConversationOut(
				session_id=conv.session_id,
				risk_level=conv.risk_level,
				language=conv.language,
				timestamp=conv.created_at,
				messages=[
					ConversationMessage(
						sender=m.sender, content=m.content, timestamp=m.created_at
					)
					for m in sorted(conv.messages, key=lambda m: m.created_at)
				],
			)
		)

	return ConversationsResponse(conversations=payload)


@router.get("/stats", response_model=StatsResponse, dependencies=[Depends(require_admin)])
async def stats(db: AsyncSession = Depends(get_db)):
	# Aggregate risk levels for dashboard charts.
	counts = (
		await db.execute(
			select(Conversation.risk_level, func.count()).group_by(Conversation.risk_level)
		)
	).all()
	bucket = {row[0]: row[1] for row in counts}
	total = sum(bucket.values())

	flagged_count_result = await db.execute(
		select(func.count()).where(Conversation.flagged == True)
	)
	flagged = flagged_count_result.scalar() or 0

	alerts_count_result = await db.execute(select(func.count()).select_from(Alert))
	alerts = alerts_count_result.scalar() or 0

	return StatsResponse(
		total=total,
		green=bucket.get("green", 0),
		amber=bucket.get("amber", 0),
		red=bucket.get("red", 0),
		flagged=flagged,
		alerts=alerts,
	)


@router.get("/alerts", response_model=AlertsResponse, dependencies=[Depends(require_admin)])
async def get_alerts(db: AsyncSession = Depends(get_db)):
	stmt = select(Alert).order_by(Alert.created_at.desc())
	alerts = (await db.execute(stmt)).scalars().all()
	return AlertsResponse(alerts=[AlertOut.model_validate(a) for a in alerts])
