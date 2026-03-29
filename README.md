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

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Bootstrap 5 + Custom CSS
- **Routing:** React Router v6
- **State Management:** React Context API

## Project Structure

```
lifeline/
├── src/
│   ├── components/          # Reusable components
│   │   ├── GlobalHeader.jsx    # Header with quick exit, language toggle, risk indicator
│   │   ├── LanguageToggle.jsx
│   │   └── RiskIndicator.jsx
│   ├── context/             # React Context providers
│   │   ├── LanguageContext.jsx  # Multi-language support
│   │   └── RiskContext.jsx      # Risk assessment logic
│   ├── pages/
│   │   ├── survivor/        # Survivor flow pages
│   │   │   ├── AnonymousEntry.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   ├── Results.jsx
│   │   │   └── Resources.jsx
│   │   ├── admin/           # Admin flow pages
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ConversationViewer.jsx
│   │   │   └── ResourceManager.jsx
│   │   └── Landing.jsx
│   ├── App.jsx              # Main app with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## User Flows

### Survivor Flow
1. **Landing Page** → Choose "I Need Help"
2. **Anonymous Entry** → No account required
3. **Chatbot** → Describe situation, AI assesses risk
4. **Results** → Get safety tips based on risk level
5. **Resources** → View local support services

### Admin Flow
1. **Landing Page** → Choose "Admin Login"
2. **Login** → Password protected (default: `admin123`)
3. **Dashboard** → View statistics and risk breakdown
4. **Conversation Viewer** → Review flagged cases
5. **Resource Manager** → Add/edit support resources

## Getting Started

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.9+ (for backend)

### Frontend Setup

```bash
# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend Setup (Partner's Work)

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
CLAUDE_API_KEY=your_key_here
CLAUDE_MODEL=claude-3-sonnet-20240229
ADMIN_PASSWORD=admin123
ADMIN_TOKEN=demo-admin-token
ALLOWED_ORIGINS=http://localhost:5173
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
- Risk assessment based on conversation keywords
- Personalized safety tips based on risk level
- Location-filtered resource directory
- Emergency contact quick-dial

### Admin Features
- Password-protected access
- Dashboard with conversation statistics
- Risk level breakdown and filtering
- Conversation viewer for flagged cases
- Full CRUD for resource management

## API Integration

The frontend is now **fully integrated** with the backend API. Here's how they connect:

### Frontend → Backend Endpoints

| Frontend Service | Backend Endpoint | Description |
|-----------------|------------------|-------------|
| `chatApi.sendMessage()` | `POST /chat` | Send message, get AI response + risk level |
| `resourcesApi.getByLocation()` | `GET /resources?location=&language=` | Fetch resources by location |
| `adminApi.login()` | `POST /admin/login` | Admin authentication |
| `adminApi.getConversations()` | `GET /admin/conversations` | Get all conversations (auth required) |
| `adminApi.getStats()` | `GET /admin/stats` | Get dashboard statistics (auth required) |
| `healthApi.check()` | `GET /health` | Health check endpoint |

### Backend Data Models

The backend uses these models (defined in `backend/app/models.py`):
- **Conversation**: Stores session info, risk level, language
- **Message**: Individual messages linked to conversations
- **Resource**: Support resources (hotlines, shelters, organizations)

### Risk Level Mapping

Backend uses: `green`, `amber`, `red`
Frontend maps to: `low`, `medium`, `high`

### Running Both Services

1. **Start backend** (in one terminal):
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Start frontend** (in another terminal):
   ```bash
   npm run dev
   ```

3. **Access the app**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Backend Docs: http://localhost:8000/docs

## Security Considerations

- No personal data stored locally
- Quick exit for emergency situations
- Admin authentication required for sensitive data
- All conversations are anonymous by design

## Next Steps

1. **Test Backend Integration**:
   - Start both frontend and backend servers
   - Test chatbot with real AI (Claude API)
   - Verify resources load from database
   - Test admin dashboard with real data

2. **Configure Claude API** (for AI chatbot):
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

## License

This project is part of a final year academic project.

## Contact

For questions or collaboration, reach out to the development team.
