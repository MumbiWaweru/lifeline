# Lifeline

Monorepo for the Lifeline GBV support app.

## Tech Stack
- Frontend: React + Vite
- Backend: FastAPI + SQLAlchemy (async)
- Default DB: SQLite (`backend/app.db`)
- LLM provider: OpenRouter (`openai/gpt-oss-120b:free` by default)

## Project Structure
```text
lifeline/
├── frontend/
└── backend/
```

## Prerequisites
- Node.js 18+
- Python 3.11+ (3.14 also works)

## Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
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

Run backend:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend URLs:
- API: `http://127.0.0.1:8000`
- Docs: `http://127.0.0.1:8000/docs`

## Frontend Setup
```bash
cd frontend
npm install
```

Run frontend (default backend URL is `http://localhost:8000`):
```bash
npm run dev
```

If backend runs on a different port (example `8001`), run:
```bash
VITE_API_URL=http://127.0.0.1:8001 npm run dev -- --host 127.0.0.1 --port 5173
```

Frontend URL:
- App: `http://127.0.0.1:5173`

## Run Both (Quick Start)
Terminal 1:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2:
```bash
cd frontend
npm install
npm run dev
```

## Notes
- Chat falls back to heuristic responses if OpenRouter key is missing or provider request fails/rate-limits.
- Admin auth is static token/password for demo usage.
- Backend details are documented in [backend/README.md](backend/README.md).

2. **Start backend** (serves frontend from static):
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

3. **Access the app**:
   - Everything at http://localhost:8000

## Security Considerations

- No personal data stored locally
- Quick exit for emergency situations
- Admin authentication with bearer tokens
- All conversations are anonymous by design
- Session-based tracking for continuity
- Alerts for high-risk incidents

## Recent Updates

### What's New
✅ **Frontend reorganized** into dedicated `frontend/` folder
✅ **Full backend integration** for all features
✅ **Counsellor system** - browse, request, and manage
✅ **Alerts dashboard** - view high-risk incidents
✅ **Flagged conversations** - filter and review
✅ **Enhanced chatbot** - better error handling, offline mode, hotline display
✅ **Improved resources** - better API integration, bilingual support
✅ **Real admin data** - no more mock data, everything from backend

## Next Steps

1. **Test Backend Integration**:
   - Start both frontend and backend servers
   - Test chatbot with enhanced stub AI
   - Verify resources load from database
   - Test admin dashboard with real data

2. **Configure Claude API** (optional):
   - Get API key from Anthropic
   - Add to backend `.env`: `CLAUDE_API_KEY=your_key`

3. **Production Deployment**:
   - Set up production database (PostgreSQL)
   - Configure environment variables
   - Set up proper admin authentication
   - Deploy frontend (Vercel, Netlify, etc.)
   - Deploy backend (Railway, Render, etc.)

4. **Testing**:
   - Add unit and integration tests
   - Test all user flows
   - Verify risk assessment accuracy

5. **Enhancements**:
   - Add geolocation for automatic location detection
   - Add more languages
   - Improve AI prompt for better responses
   - Add analytics and reporting
   - Implement JWT authentication

## License

This project is part of a final year academic project.

## Contact

For questions or collaboration, reach out to the development team.
