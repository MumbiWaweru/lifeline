## GBV Support & Risk Assessment API (Kenya)

FastAPI backend for a trauma‑informed GBV support and resource platform serving survivors, counsellors, and admins in Kenya. The system stores conversations, scores risk (green/amber/red), raises alerts on high risk, and delivers localized resources. The AI layer is a **pluggable interface**: it currently uses a privacy‑friendly rule‑based stub with conversation memory, and can be swapped for a local LLM (e.g., phi‑2) or a cloud model (Claude) by providing an API key/loader.

### Tech stack
- FastAPI, Pydantic v2
- SQLAlchemy (async) with SQLite (default) or PostgreSQL
- Simple bearer token guard for admin routes (static token from `.env`)
- Rule‑based AI engine (ClaudeClient stub); optional LLM (phi‑2, Claude API) via the same interface

### Setup (quick)
```bash
git clone https://github.com/MumbiWaweru/lifeline.git
cd lifeline/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cat > .env <<'EOF'
DATABASE_URL=sqlite+aiosqlite:///./app.db
ADMIN_PASSWORD=changeme
ADMIN_TOKEN=demo-admin-token
CLAUDE_API_KEY=
CLAUDE_MODEL=claude-3-sonnet-20240229
ALLOWED_ORIGINS=*
ENVIRONMENT=development
EOF

uvicorn app.main:app --reload
```
- Docs UI: http://localhost:8000/docs
- If `CLAUDE_API_KEY` is empty, the Claude client runs the enhanced stub; swap in any LLM by implementing the same `generate()` interface.

### API quick reference
| Category | Method & Path | Description |
| --- | --- | --- |
| Chat | `POST /chat` | Send message, get reply + risk + hotlines; stores conversation/messages; creates alert on red. |
| Resources | `GET /resources?location=&language=` | List resources by location/language (fallback data if empty). |
| Admin Auth | `POST /admin/login` | Returns static bearer token when password matches env. |
| Admin | `GET /admin/conversations` (list), `GET /admin/stats`, `GET /admin/alerts` | Protected by bearer token. |
| Counsellors | `GET /counsellors` (public list), `POST /counsellors/request` (survivor request), admin CRUD & request status under `/counsellors/admin/*` | Manage and request counsellor support. |
| Health | `GET /health` | Liveness check. |

### More documentation
- [Setup](./docs/setup.md)
- [API endpoints](./docs/api-endpoints.md)
- [Database schema](./docs/database-schema.md)
- [AI integration](./docs/ai-integration.md)
- [Security](./docs/security.md)
- [Module reference](./docs/modules/)

### Scalability note
The AI service is a pluggable abstraction (`ClaudeClient`). The current smart stub uses weighted keywords, sentiment, and short‑term memory to produce bilingual replies without external calls. To scale, provide an API key or load a local LLM that implements the same `generate()` signature; the rest of the app (routes, schemas, persistence) stays unchanged.
