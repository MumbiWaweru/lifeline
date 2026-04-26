"""
main.py — LIFELINE FastAPI application entry point
Integrates: Socket.io (real-time), all routers, rate limiting, CORS, SlowAPI.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import socketio
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from database import engine, Base
from backend.app.websocket import sio, rest_router as messages_router
from auth import router as auth_router
from risk_engine import router as risk_router
from resources import router as resources_router
from admin import router as admin_router
from chat import router as chat_router

# ─── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ─── App lifespan ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all DB tables on startup (dev only; use Alembic in production)
    Base.metadata.create_all(bind=engine)
    yield

# ─── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="LIFELINE API",
    description="AI-Powered GBV Support and Risk Assessment Platform",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ─────────────────────────────────────────────────────────────────────
allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ─── Security headers middleware ───────────────────────────────────────────────
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"]  = "nosniff"
    response.headers["X-Frame-Options"]         = "DENY"
    response.headers["X-XSS-Protection"]        = "1; mode=block"
    response.headers["Referrer-Policy"]         = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"]      = "camera=(), microphone=(), geolocation=(self)"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "connect-src 'self' wss:;"
    )
    return response

# ─── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(risk_router)
app.include_router(resources_router)
app.include_router(messages_router)
app.include_router(admin_router)
app.include_router(chat_router)

# ─── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
@limiter.limit("60/minute")
async def health(request: Request):
    return {"status": "healthy", "version": "2.0.0"}

# ─── Mount Socket.io as ASGI sub-app ──────────────────────────────────────────
# Socket.io runs on /socket.io/* — compatible with socket.io client v4
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# ─── Entry point ──────────────────────────────────────────────────────────────
# Run with: uvicorn main:socket_app --host 0.0.0.0 --port 8000 --reload