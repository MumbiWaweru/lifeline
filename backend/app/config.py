"""Application settings and constants for the demo build."""

from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
	# FastAPI metadata
	app_name: str = "GBV Support API"
	environment: str = "development"

	# Gemini / Google
	gemini_api_key: str | None = None

	# Database (SQLite by default for easy setup; override with Postgres if needed)
	database_url: str = "sqlite+aiosqlite:///./app.db"

	# Admin auth (simple token-based guard for demo)
	admin_password: str = "changeme"
	admin_token: str = "demo-admin-token"

	# CORS
	allowed_origins: List[AnyHttpUrl] | List[str] = ["*"]

	@field_validator("allowed_origins", mode="before")
	@classmethod
	def _parse_origins(cls, v):  # type: ignore[override]
		if isinstance(v, str):
			if v.strip() == "*":
				return ["*"]
			return [item.strip() for item in v.split(",") if item.strip()]
		return v

	class Config:
		env_file = ".env"
		env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
	"""Cache settings to avoid re-parsing environment variables."""
	return Settings()
