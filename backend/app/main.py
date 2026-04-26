"""
main.py — LIFELINE FastAPI Application (Updated)
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.database import engine, Base, AsyncSessionLocal
from app.models   import Resource

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lifeline")

# ── Rate limiter ───────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


# ── Startup / Shutdown ─────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed resources if empty
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select, func
        count = await db.scalar(select(func.count(Resource.id)))
        if count == 0:
            await _seed_resources(db)

    logger.info("✅ LIFELINE backend started")
    yield
    logger.info("LIFELINE backend shutting down")


async def _seed_resources(db):
    resources = [
        Resource(name="GBV National Hotline",    number="1195",         type="hotline",      location="Kenya",   language="en", latitude=-1.2921, longitude=36.8219),
        Resource(name="FIDA Kenya",              number="0719 638 006", type="legal",        location="Nairobi", language="en", latitude=-1.2834, longitude=36.8155),
        Resource(name="Wangu Kanja Foundation",  number="0721 345 678", type="support",      location="Nairobi", language="en", latitude=-1.3000, longitude=36.8000),
        Resource(name="Kituo cha Sheria",        number="0800 720 765", type="legal",        location="Nairobi", language="en", latitude=-1.2800, longitude=36.8300),
        Resource(name="GVRC Kenyatta Hospital",  number="0722 178 177", type="medical",      location="Nairobi", language="en", latitude=-1.3010, longitude=36.8073),
        Resource(name="Msaada wa Dharura",       number="1195",         type="hotline",      location="Kenya",   language="sw", latitude=-1.2921, longitude=36.8219),
        Resource(name="Polisi ya Kenya",         number="999",          type="police",       location="Kenya",   language="sw", latitude=-1.2921, longitude=36.8219),
        Resource(name="Haven of Peace",          number="0720 854 854", type="shelter",      location="Mombasa", language="en", latitude=-4.0435, longitude=39.6682),
    ]
    for r in resources:
        db.add(r)
    await db.commit()
    logger.info(f"Seeded {len(resources)} resources")


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="LIFELINE GBV Support API",
    version="2.0.0",
    description="AI-powered GBV support platform with 4-level risk assessment",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — restrict to known origins in production
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3002").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Routes ─────────────────────────────────────────────────────────────────────
from app.routes.chat      import router as chat_router
from app.routes.admin     import router as admin_router
from app.routes.resources import router as resources_router
from app.routes.counsellors import router as counsellors_router

app.include_router(chat_router)
app.include_router(admin_router)
app.include_router(resources_router)
app.include_router(counsellors_router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "features": [
            "4-level AI risk classification",
            "LIME explanations",
            "AES-256-GCM message encryption",
            "JWT authentication with expiry",
            "TOTP MFA",
        ],
    }