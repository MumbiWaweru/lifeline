"""Reusable FastAPI dependencies."""

from fastapi import Depends, Header, HTTPException, status

from .config import get_settings
from .database import get_db
from .services.claude import ClaudeClient


# Dependency to provide a configured Claude client instance (always stub).
def get_chat_model():
    """Return the enhanced stub (no API key, no local model)."""
    return ClaudeClient(api_key=None, model="stub")


# Dependency to enforce admin access on protected routes.
async def require_admin(authorization: str | None = Header(None)) -> None:
    """Very lightweight admin check using a static token for the demo."""
    settings = get_settings()
    if not authorization or authorization.replace("Bearer ", "") != settings.admin_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin token")