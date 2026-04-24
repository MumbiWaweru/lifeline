"""Reusable FastAPI dependencies."""

from fastapi import Depends, Header, HTTPException, status

from .config import get_settings
from .database import get_db
from .services.gemini import GeminiClient

# Dependency to provide a configured Gemini client instance.
def get_gemini_client() -> GeminiClient:
	"""Provide a Gemini client instance with configured API key."""
	settings = get_settings()
	return GeminiClient(api_key=settings.gemini_api_key)

#  Dependency to enforce admin access on protected routes.
async def require_admin(authorization: str | None = Header(None)) -> None:
	"""Very lightweight admin check using a static token for the demo."""
	settings = get_settings()
	if not authorization or authorization.replace("Bearer ", "") != settings.admin_token:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin token")
