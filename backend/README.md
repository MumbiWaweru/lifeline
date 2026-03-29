# GBV Support API (FastAPI demo)

This is a demo backend for the GBV Support and Risk Assessment platform. It wires FastAPI, SQLite (by default) or PostgreSQL (optional), and a Claude integration for risk assessment.

## Quick start
1. Create a virtualenv and install deps:
   ```bash
   cd backend
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Configure environment (optional overrides):
   ```bash
   cat > .env <<'EOF'
   DATABASE_URL=sqlite+aiosqlite:///./app.db
   CLAUDE_API_KEY=your_key_here
   CLAUDE_MODEL=claude-3-sonnet-20240229
   ADMIN_PASSWORD=changeme
   ADMIN_TOKEN=demo-admin-token
   ALLOWED_ORIGINS=*
   EOF
   ```
   - If `CLAUDE_API_KEY` is missing, the app falls back to a stubbed response so the demo still works.
3. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```
4. Visit interactive docs at http://localhost:8000/docs.

## Notes
- Startup creates tables and seeds a few Kenya resources if empty.
- Admin login uses a static password/token pair from env. Replace for your demo.
- This is a university demo: do not ship to production without hardening auth, storage, logging, and prompt safety.
