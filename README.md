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
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

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

## API Integration (Backend Pending)

The frontend is ready to integrate with backend APIs. Key integration points:

1. **Chatbot** - Replace `getSimulatedResponse()` with actual AI API call
2. **Risk Assessment** - Connect to backend risk analysis service
3. **Resources** - Fetch from backend database instead of static data
4. **Admin Auth** - Implement proper JWT authentication
5. **Conversations** - Load real conversation history from database

## Security Considerations

- No personal data stored locally
- Quick exit for emergency situations
- Admin authentication required for sensitive data
- All conversations are anonymous by design

## Next Steps

1. **Backend Integration** - Connect to partner's backend API
2. **Real AI Integration** - Connect to actual chatbot/AI service
3. **Geolocation** - Add location-based resource filtering
4. **Testing** - Add unit and integration tests
5. **Deployment** - Set up production deployment pipeline

## License

This project is part of a final year academic project.

## Contact

For questions or collaboration, reach out to the development team.
