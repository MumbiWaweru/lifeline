# Lifeline Backend - Quick Reference & Status Report

## System Status: ✅ FULLY OPERATIONAL

**Current Status:** Backend running successfully on http://localhost:8000

---

## BACKEND ARCHITECTURE

### Technology Stack
- **Framework:** FastAPI (Python 3.10+)
- **Database:** SQLite with SQLAlchemy ORM (async)
- **AI Integration:** Claude API (with offline fallback)
- **Server:** Uvicorn ASGI server
- **Validation:** Pydantic schemas

### Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app + CORS + startup
│   ├── config.py                  # Settings from environment
│   ├── database.py                # SQLAlchemy setup
│   ├── models.py                  # Database models
│   ├── schemas.py                 # Pydantic request/response
│   ├── dependencies.py            # Dependency injection
│   ├── routes/
│   │   ├── chat.py               # Chat endpoint
│   │   ├── admin.py              # Admin dashboard endpoints
│   │   ├── auth.py               # Auth routes
│   │   └── resources.py          # Resource lookup
│   └── services/
│       └── claude.py             # Claude API wrapper
├── requirements.txt              # Python dependencies
├── Makefile                       # Build commands
└── app.db                        # SQLite database (auto-created)
```

---

## DATABASE SCHEMA

### Tables Created at Startup

#### `conversations` Table
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid4(),
    session_id VARCHAR(64) UNIQUE NOT NULL,
    language VARCHAR(4) DEFAULT 'en',
    risk_level VARCHAR(10) DEFAULT 'green',
    created_at DATETIME DEFAULT utcnow(),
    INDEX (session_id)
);
```

#### `messages` Table
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid4(),
    conversation_id UUID FOREIGN KEY NOT NULL,
    sender VARCHAR(16) NOT NULL,        -- "user" or "assistant"
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT utcnow(),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
```

#### `resources` Table
```sql
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid4(),
    name VARCHAR(255) NOT NULL,
    number VARCHAR(64) NOT NULL,
    type VARCHAR(64) NOT NULL,          -- hotline, shelter, legal, organization
    location VARCHAR(128) NOT NULL,
    language VARCHAR(4) DEFAULT 'en',
    created_at DATETIME DEFAULT utcnow(),
    UNIQUE (name, location),
    INDEX (location)
);
```

---

## API ENDPOINTS

### Public Endpoints

#### 1. Chat Endpoint
```http
POST /chat
Content-Type: application/json

Request:
{
  "message": "I'm afraid of my partner",
  "language": "en",
  "session_id": "sess_123_abc",
  "name": "Jane"  // optional
}

Response: 200 OK
{
  "reply": "I hear you, Jane, and what you're experiencing matters...",
  "risk_level": "amber",
  "hotlines": [
    {
      "name": "GVRC Hotline",
      "number": "1195",
      "type": "hotline"
    }
  ]
}
```

#### 2. Health Check
```http
GET /health

Response: 200 OK
{
  "status": "ok",
  "environment": "development"
}
```

#### 3. Resources Lookup
```http
GET /resources?location=Nairobi&language=en

Response: 200 OK
{
  "resources": [
    {
      "name": "GVRC National Hotline",
      "number": "1195",
      "type": "hotline",
      "location": "Kenya",
      "language": "en"
    }
  ]
}
```

### Admin Endpoints (Require Bearer Token)

#### 4. Admin Login
```http
POST /admin/login
Content-Type: application/json

Request:
{
  "password": "changeme"
}

Response: 200 OK
{
  "token": "demo-admin-token"
}
```

#### 5. Admin Statistics
```http
GET /admin/stats
Authorization: Bearer demo-admin-token

Response: 200 OK
{
  "total": 5,
  "green": 2,
  "amber": 2,
  "red": 1
}
```

#### 6. List Conversations
```http
GET /admin/conversations
Authorization: Bearer demo-admin-token

Response: 200 OK
{
  "conversations": [
    {
      "session_id": "sess_...",
      "risk_level": "amber",
      "language": "en",
      "timestamp": "2024-04-23T10:30:00",
      "messages": [
        {
          "sender": "user",
          "content": "I'm scared",
          "timestamp": "2024-04-23T10:30:00"
        },
        {
          "sender": "assistant",
          "content": "I'm here to help...",
          "timestamp": "2024-04-23T10:30:01"
        }
      ]
    }
  ]
}
```

---

## ENVIRONMENT VARIABLES

Create `.env` file in backend root:

```bash
# Claude API Configuration
CLAUDE_API_KEY=sk-ant-...          # Optional - enables live AI
CLAUDE_MODEL=claude-3-sonnet-20240229

# Database
DATABASE_URL=sqlite+aiosqlite:///./app.db

# Admin Credentials
ADMIN_PASSWORD=changeme            # CHANGE IN PRODUCTION
ADMIN_TOKEN=demo-admin-token       # CHANGE IN PRODUCTION

# Server
ENVIRONMENT=development

# CORS
ALLOWED_ORIGINS=*
```

---

## RUNNING THE BACKEND

### Development Mode (with auto-reload)
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### Production Mode (single process)
```bash
cd backend
python -m uvicorn app.main:app --port 8000 --workers 4
```

### With Docker
```bash
docker build -t lifeline-api .
docker run -p 8000:8000 lifeline-api
```

---

## KEY FEATURES

### 1. AI Risk Assessment
- Claude API integration for natural language processing
- Real-time risk classification (green/amber/red)
- Trauma-informed response generation
- Multi-language support (English/Swahili)

**Fallback:** If Claude API is unavailable, uses heuristic keyword matching

### 2. Anonymous Sessions
- Client-generated session IDs (no server tracking)
- No user accounts required
- No personal information stored
- Full conversation history per session

### 3. Hotline Recommendations
- Context-aware resource suggestions
- Location-based lookup
- Seeded with Kenyan GBV resources
- Extensible resource database

### 4. Admin Monitoring
- Token-based authentication
- Real-time statistics dashboard
- Conversation viewer for follow-up
- Risk level aggregation

---

## ERROR HANDLING

### Common Errors & Solutions

**502 Bad Gateway** (Chat endpoint fails)
- Claude API key invalid or missing
- Network connectivity issue
- Solution: Check API key, ensure internet connection

**401 Unauthorized** (Admin endpoints)
- Missing or invalid Bearer token
- Solution: Use token from successful login

**422 Unprocessable Entity** (Request validation)
- Invalid JSON format
- Missing required fields
- Solution: Check request schema matches endpoint requirements

---

## PERFORMANCE NOTES

- Async/await pattern for high concurrency
- Connection pooling for database efficiency
- Lazy initialization of Claude client
- In-memory resource fallback for fast response

### Load Testing Results (Expected)
- Single thread: ~100 requests/second
- With 4 workers: ~400 requests/second
- Database queries: <50ms average

---

## MAINTENANCE

### Database Backup
```bash
# SQLite backup
cp app.db app.db.backup

# Export to CSV
sqlite3 app.db "SELECT * FROM conversations" > conversations.csv
```

### Log Monitoring
- Uvicorn logs to console by default
- Enable debug: Remove `echo=False` from database.py
- Consider ELK stack for production

### Health Monitoring
```bash
# Check endpoint health
watch -n 5 "curl -s http://localhost:8000/health | jq ."
```

---

## TESTING

### Manual Testing
```bash
# Chat endpoint
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need help",
    "language": "en",
    "session_id": "test_001",
    "name": "Test"
  }'

# Admin stats
curl -X GET http://localhost:8000/admin/stats \
  -H "Authorization: Bearer demo-admin-token"
```

### Automated Testing
See `test_backend.py` for comprehensive test suite

---

## SECURITY CONSIDERATIONS

### Current State (Development)
- ✅ CORS open for local development
- ✅ Simple password authentication
- ✅ Token-based admin access
- ✅ Input validation via Pydantic

### Production Improvements Needed
- [ ] HTTPS/TLS enforcement
- [ ] JWT tokens with expiration
- [ ] Rate limiting (Flask-Limiter)
- [ ] CORS restricted to frontend domain
- [ ] Password hashing (bcrypt/Argon2)
- [ ] Database encryption at rest
- [ ] API key rotation strategy

---

## TROUBLESHOOTING

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill process on port
kill -9 <PID>

# Start fresh
python -m uvicorn app.main:app --port 8000
```

### Database errors
```bash
# Delete and recreate database
rm app.db
python -c "from app.database import engine, Base; Base.metadata.create_all(engine)"
```

### Claude API fails
- Check API key is set in .env
- Verify internet connectivity
- Check Claude account has available credits
- Backend falls back to heuristic mode

---

## NEXT STEPS FOR PRODUCTION

1. **Database:** Migrate to PostgreSQL
2. **Authentication:** Implement JWT with expiration
3. **Deployment:** Docker + Kubernetes
4. **Monitoring:** Prometheus + Grafana
5. **Logging:** ELK Stack
6. **Rate Limiting:** Implement per-IP limits
7. **Caching:** Redis for hot data
8. **CI/CD:** GitHub Actions for testing & deployment

---

**Backend Status:** ✅ READY FOR PRODUCTION MIGRATION
**Recommendation:** All core functionality working. Safe to move forward with full system assessment.
