# Lifeline Backend (FastAPI)

FastAPI backend for the Lifeline GBV support project.

## Stack
- FastAPI
- SQLAlchemy (async)
- SQLite by default (`app.db`)
- OpenRouter chat provider (default model: `openai/gpt-oss-120b:free`)

## Quick Start
1. Create and activate a virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create `.env`:
   ```bash
   cat > .env <<'EOF'
   APP_NAME=GBV Support API
   ENVIRONMENT=development
   OPENROUTER_API_KEY=your_openrouter_key
   OPENROUTER_MODEL=openai/gpt-oss-120b:free
   DATABASE_URL=sqlite+aiosqlite:///./app.db
   ADMIN_PASSWORD=changeme
   ADMIN_TOKEN=demo-admin-token
   ALLOWED_ORIGINS=*
   EOF
   ```
4. Run:
   ```bash
   uvicorn app.main:app --reload
   ```

Backend runs at `http://localhost:8000` and docs at `http://localhost:8000/docs`.

## API Endpoints
- `GET /health`
- `POST /chat`
- `GET /resources`
- `POST /admin/login`
- `GET /admin/stats`
- `GET /admin/conversations`

## Chat Provider Behavior
- Backend sends chat generation requests to OpenRouter using `OPENROUTER_API_KEY`.
- If key is missing or provider request fails (e.g. rate limits), backend returns heuristic fallback responses to preserve API availability.

## Notes
- On startup, tables are created and initial resources are seeded if DB is empty.
- Admin auth is static-token based for demo/dev only; harden before production.
