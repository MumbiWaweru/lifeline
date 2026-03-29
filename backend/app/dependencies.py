"""Reusable FastAPI dependencies."""

from fastapi import Depends, Header, HTTPException, status

from .config import get_settings
from .database import get_db
from .services.claude import ClaudeClient

# Dependency to provide a configured Claude client instance.
def get_claude_client() -> ClaudeClient:
	"""Provide a Claude client instance with configured API key/model."""
	settings = get_settings()
	return ClaudeClient(api_key=settings.claude_api_key, model=settings.claude_model)

#  Dependency to enforce admin access on protected routes.
async def require_admin(authorization: str | None = Header(None)) -> None:
	"""Very lightweight admin check using a static token for the demo."""
	settings = get_settings()
	if not authorization or authorization.replace("Bearer ", "") != settings.admin_token:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin token")
