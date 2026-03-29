"""Database session/engine setup for SQLAlchemy (async)."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from .config import get_settings


settings = get_settings()

# Create async engine; echo can be toggled via env if needed
engine = create_async_engine(settings.database_url, echo=False, future=True)

# Session factory for request-scoped sessions
AsyncSessionLocal = async_sessionmaker(
	bind=engine,
	expire_on_commit=False,
	class_=AsyncSession,
)

# Declarative base for models
Base = declarative_base()


async def get_db() -> AsyncSession:
	"""Yield an async DB session per request."""
	async with AsyncSessionLocal() as session:
		yield session
