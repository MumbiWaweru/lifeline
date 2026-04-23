# Lifeline - GBV Support Application

A confidential support application for Gender-Based Violence (GBV) survivors, providing anonymous chatbot assistance and local resource connections.

## Project Overview

**Lifeline** is a final year project that provides:
- **Anonymous support** for survivors without requiring account creation
- **AI-powered chatbot** that assesses risk levels and provides guidance
- **Local resource directory** with hotlines, shelters, organizations, and police contacts
- **Admin dashboard** for monitoring conversations and managing resources
- **Multi-language support** (English & Swahili)
- **Quick exit button** for user safety
- **Counsellor matching** for personalized support

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** FastAPI (Python) + SQLAlchemy
- **Styling:** Bootstrap 5 + Custom CSS with glassmorphism design
- **Routing:** React Router v6
- **State Management:** React Context API
- **Database:** SQLite (dev) / PostgreSQL (production)
- **AI:** Enhanced rule-based stub (with Claude API integration ready)

## Project Structure

```
lifeline/
├── frontend/                    # Frontend React application
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   │   ├── GlobalHeader.jsx    # Header with quick exit, language toggle, risk indicator
│   │   │   ├── LanguageToggle.jsx
│   │   │   └── RiskIndicator.jsx
│   │   ├── context/             # React Context providers
│   │   │   ├── LanguageContext.jsx  # Multi-language support
│   │   │   └── RiskContext.jsx      # Risk assessment logic
│   │   ├── pages/
│   │   │   ├── survivor/        # Survivor flow pages
│   │   │   │   ├── AnonymousEntry.jsx
│   │   │   │   ├── Chatbot.jsx
│   │   │   │   ├── Results.jsx
│   │   │   │   ├── Resources.jsx
│   │   │   │   └── Counsellors.jsx       # NEW: View & request counsellors
│   │   │   ├── admin/           # Admin flow pages
│   │   │   │   ├── AdminLogin.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── ConversationViewer.jsx
│   │   │   │   ├── ResourceManager.jsx
│   │   │   │   ├── Alerts.jsx              # NEW: View high-risk alerts
│   │   │   │   └── CounsellorManagement.jsx # NEW: Manage counsellors
│   │   │   └── Landing.jsx
│   │   ├── services/
│   │   │   └── api.js           # API service for backend integration
│   │   ├── config.js            # App configuration
│   │   ├── App.jsx              # Main app with routing
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── backend/                     # Backend FastAPI application
│   ├── app/
│   │   ├── models.py            # Database models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── routes/              # API routes
│   │   │   ├── chat.py
│   │   │   ├── resources.py
│   │   │   ├── admin.py
│   │   │   └── counsellors.py   # NEW: Counsellor endpoints
│   │   ├── services/
│   │   │   ├── claude.py        # AI client with enhanced stub
│   │   │   └── phi2.py          # Optional local LLM
│   │   └── main.py
│   ├── requirements.txt
│   └── README.md
└── README.md
```

## User Flows

### Survivor Flow
1. **Landing Page** → Choose "I Need Help"
2. **Anonymous Entry** → No account required
3. **Chatbot** → Describe situation, AI assesses risk
4. **Results** → Get safety tips based on risk level
5. **Resources** → View local support services
6. **Counsellors** → Browse and request counsellor support (NEW)

### Admin Flow
1. **Landing Page** → Choose "Admin Login"
2. **Login** → Password protected (default: `changeme`)
3. **Dashboard** → View statistics, flagged cases, and alerts
4. **Conversation Viewer** → Review flagged cases with filters
5. **Alerts** → View high-risk incidents requiring attention (NEW)
6. **Counsellor Management** → Add/remove counsellors, manage requests (NEW)
7. **Resource Manager** → Add/edit support resources

## Getting Started

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Start development server (with backend proxy)
npm run dev

# Build for production (outputs to backend/static)
npm run build
```

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with configuration
cat > .env <<'EOF'
DATABASE_URL=sqlite+aiosqlite:///./app.db
ADMIN_PASSWORD=changeme
ADMIN_TOKEN=demo-admin-token
CLAUDE_API_KEY=
CLAUDE_MODEL=claude-3-sonnet-20240229
ALLOWED_ORIGINS=*
ENVIRONMENT=development
EOF

# Start backend server
uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`
Backend API docs at `http://localhost:8000/docs`

## Features

### Global Features (Available on Every Screen)
- **Quick Exit Button** - Immediately redirects to Google for user safety
- **Language Toggle** - Switch between English and Swahili
- **Risk Indicator** - Shows current risk level (Green/Amber/Red)

### Survivor Features
- Anonymous, no-account-required entry
- AI-powered risk assessment with conversation memory
- Personalized safety tips based on risk level
- Location-filtered resource directory
- Emergency contact quick-dial
- **Browse and request counsellors** (NEW)

### Admin Features
- Password-protected access with bearer token authentication
- Dashboard with conversation statistics
- **Flagged conversations filter** (NEW)
- **High-risk alerts viewer** (NEW)
- Conversation viewer with full message history
- **Counsellor management** (CRUD + request handling) (NEW)
- Full CRUD for resource management

## API Integration

The frontend is **fully integrated** with the backend API. Here's how they connect:

### Frontend → Backend Endpoints

| Frontend Service | Backend Endpoint | Description |
|-----------------|------------------|-------------|
| `chatApi.sendMessage()` | `POST /chat` | Send message, get AI response + risk level |
| `resourcesApi.getByLocation()` | `GET /resources?location=&language=` | Fetch resources by location |
| `adminApi.login()` | `POST /admin/login` | Admin authentication |
| `adminApi.getConversations()` | `GET /admin/conversations` | Get conversations (with flagged filter) |
| `adminApi.getStats()` | `GET /admin/stats` | Get dashboard statistics (includes flagged, alerts) |
| `adminApi.getAlerts()` | `GET /admin/alerts` | Get high-risk alerts |
| `counsellorsApi.getAll()` | `GET /counsellors/` | List available counsellors |
| `counsellorsApi.requestCounsellor()` | `POST /counsellors/request` | Request a counsellor |
| `counsellorsApi.getAllCounsellors()` | `GET /counsellors/admin/counsellors` | Admin: list all counsellors |
| `counsellorsApi.createCounsellor()` | `POST /counsellors/admin/counsellors` | Admin: create counsellor |
| `counsellorsApi.deleteCounsellor()` | `DELETE /counsellors/admin/counsellors/{id}` | Admin: delete counsellor |
| `counsellorsApi.getAllRequests()` | `GET /counsellors/admin/requests` | Admin: list requests |
| `counsellorsApi.updateRequestStatus()` | `PATCH /counsellors/admin/requests/{id}` | Admin: update request status |
| `healthApi.check()` | `GET /health` | Health check endpoint |

### Backend Data Models

The backend uses these models (defined in `backend/app/models.py`):
- **Conversation**: Stores session info, risk level, language, flagged status
- **Message**: Individual messages linked to conversations
- **Resource**: Support resources (hotlines, shelters, organizations)
- **Alert**: High-risk incident records with message previews (NEW)
- **Counsellor**: Counsellor profiles (NEW)
- **CounsellorRequest**: Requests linking survivors to counsellors (NEW)

### Risk Level Mapping

Backend uses: `green`, `amber`, `red`
Frontend displays with appropriate colors and icons

### AI Engine

The backend uses an **enhanced rule-based stub** by default (no external API calls needed):
- Keyword-based risk scoring (high/medium risk terms)
- Sentiment analysis via TextBlob
- Conversation memory (rolling 4 exchanges)
- Bilingual responses (English/Swahili)
- Always returns hotlines and supportive replies

To enable real Claude API:
1. Get API key from Anthropic
2. Add to backend `.env`: `CLAUDE_API_KEY=your_key`

## Running Both Services

### Option 1: Separate Servers (Development)

1. **Start backend** (in one terminal):
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Start frontend** (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the app**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Backend Docs: http://localhost:8000/docs

The frontend Vite dev server proxies `/api` requests to the backend automatically.

### Option 2: Production Build

1. **Build frontend** (outputs to `backend/static`):
   ```bash
   cd frontend
   npm run build
   ```

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
