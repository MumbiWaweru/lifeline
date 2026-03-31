# Setup Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Clone and Environment](#clone-and-environment)
- [Configuration](#configuration)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Install Dependencies](#install-dependencies)
- [Run the Server](#run-the-server)
- [Smoke Test](#smoke-test)

## Prerequisites
- Python 3.11+ (CPython)
- Git and `venv`
- Optional: PostgreSQL 14+ (SQLite is default)
- Optional: GPU/CUDA if you plan to load a local LLM (phi‑2); not required for the stub

## Clone and Environment
```bash
git clone https://github.com/MumbiWaweru/lifeline.git
cd lifeline/backend
python -m venv .venv
source .venv/bin/activate
```

## Configuration
Create a `.env` in `backend/` (defaults shown):
```env
DATABASE_URL=sqlite+aiosqlite:///./app.db
ADMIN_PASSWORD=changeme
ADMIN_TOKEN=demo-admin-token
CLAUDE_API_KEY=
CLAUDE_MODEL=claude-3-sonnet-20240229
ALLOWED_ORIGINS=*
ENVIRONMENT=development
APP_NAME=GBV Support API
```

## Environment variables
- `DATABASE_URL`: SQLAlchemy async URL.
  - SQLite (default): `sqlite+aiosqlite:///./app.db`
  - PostgreSQL: `postgresql+asyncpg://user:pass@localhost:5432/lifeline`
- `ADMIN_PASSWORD`: Password checked at `POST /admin/login`.
- `ADMIN_TOKEN`: Static bearer token returned by login; required on admin routes.
- `CLAUDE_API_KEY`: Optional Anthropic key. Empty = use the built‑in rule‑based stub.
- `CLAUDE_MODEL`: Claude model name if you supply an API key.
- `ALLOWED_ORIGINS`: Comma-separated origins or `*` for demo.
- `ENVIRONMENT`: Displayed by `/health`.
- `APP_NAME`: Overrides FastAPI title.

## Database
- Tables auto-create on startup; seed data for resources is inserted if empty.
- For PostgreSQL, create the database/user first, set `DATABASE_URL`, then run the app.
- Alembic is not configured; rerun the app to recreate tables during development if models change.

## Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## Run the Server
```bash
uvicorn app.main:app --reload
```
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Smoke Test
1) `POST /admin/login` with `password=ADMIN_PASSWORD`; store `token`.
2) `POST /chat` with a message, `session_id`, and `language` (`en`/`sw`).
3) `GET /admin/conversations` with `Authorization: Bearer <ADMIN_TOKEN>` to view stored threads.
4) `GET /resources?location=Nairobi&language=en` to see seeded/fallback resources.
5) Send a high-risk chat (e.g., includes "knife" or "threaten") and check `GET /admin/alerts`.
