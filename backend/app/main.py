"""FastAPI application entrypoint with routers and startup tasks."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .database import AsyncSessionLocal, Base, engine
from .models import Resource
from .routes import admin, chat, resources


settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.1.0", docs_url="/docs")

# Open CORS for demo; tighten for production
app.add_middleware(
	CORSMiddleware,
	allow_origins=[str(o) for o in settings.allowed_origins],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# Register routers
app.include_router(chat.router)
app.include_router(resources.router)
app.include_router(admin.router)

# Startup event to create tables and seed data if needed.
@app.on_event("startup")
async def on_startup() -> None:
	"""Create tables and seed minimal resources for the demo."""
	async with engine.begin() as conn:
		await conn.run_sync(Base.metadata.create_all)
	await _seed_resources()

# Note: In a production app, consider using Alembic for migrations instead of auto-creating tables on startup.
async def _seed_resources() -> None:
	"""Insert a small resource dataset if table is empty."""
	sample = [
		{
			"name": "GVRC National Hotline",
			"number": "1195",
			"type": "hotline",
			"location": "Kenya",
			"language": "en",
		},
		{
			"name": "Wangu Kanja Foundation",
			"number": "0711 200 400",
			"type": "organization",
			"location": "Nairobi",
			"language": "en",
		},
		{
			"name": "Kituo cha Sheria",
			"number": "0800 720 185",
			"type": "legal",
			"location": "Mombasa",
			"language": "sw",
		},
	]

	async with AsyncSessionLocal() as session:
		count = await session.scalar(select(func.count()).select_from(Resource))
		if count and count > 0:
			return
		session.add_all([Resource(**row) for row in sample])
		await session.commit()

# Simple health check endpoint
@app.get("/health")
async def health() -> dict[str, str]:
	"""Simple health check for the deployment target."""
	return {"status": "ok", "environment": settings.environment}
