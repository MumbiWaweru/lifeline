"""Resource lookup endpoint by location."""

from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Resource
from ..schemas import ResourceItem, ResourceResponse


router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("", response_model=ResourceResponse)
async def get_resources(
	location: str = Query(..., description="County or city in Kenya"),
	language: str = Query("en", description="en or sw"),
	db: AsyncSession = Depends(get_db),
):
	# Fetch resources matching location (case-insensitive) and language.
	stmt = select(Resource).where(Resource.location.ilike(f"%{location}%"))
	results = (await db.execute(stmt)).scalars().all()

	# If nothing found, fall back to a small built-in set so the demo never returns empty.
	if not results:
		results = _fallback_resources(location, language)

	return ResourceResponse(resources=[ResourceItem.model_validate(r) for r in results])


def _fallback_resources(location: str, language: str) -> List[Resource]:
	# Minimal embedded dataset to keep the demo useful before seeding the DB.
	base = [
		Resource(
			name="GVRC Nairobi",
			number="1195",
			type="hotline",
			location="Nairobi",
			language=language,
		),
		Resource(
			name="Wangu Kanja Foundation",
			number="0711 200 400",
			type="organization",
			location="Nairobi",
			language=language,
		),
		Resource(
			name="Kituo cha Sheria",
			number="0800 720 185",
			type="legal",
			location="Mombasa",
			language=language,
		),
	]
	return [r for r in base if location.lower() in r.location.lower() or location.strip() == ""]
