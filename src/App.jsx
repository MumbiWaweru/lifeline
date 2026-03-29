import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { RiskProvider } from './context/RiskContext'
import GlobalHeader from './components/GlobalHeader'

// Survivor pages
import Landing from './pages/Landing'
import AnonymousEntry from './pages/survivor/AnonymousEntry'
import Chatbot from './pages/survivor/Chatbot'
import Results from './pages/survivor/Results'
import Resources from './pages/survivor/Resources'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import ConversationViewer from './pages/admin/ConversationViewer'
import ResourceManager from './pages/admin/ResourceManager'

function App() {
  return (
    <LanguageProvider>
      <RiskProvider>
        <BrowserRouter>
          <GlobalHeader />
          <div className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              
              {/* Survivor Flow */}
              <Route path="/entry" element={<AnonymousEntry />} />
              <Route path="/chat" element={<Chatbot />} />
              <Route path="/results" element={<Results />} />
              <Route path="/resources" element={<Resources />} />
              
              {/* Admin Flow */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/conversations" element={<ConversationViewer />} />
              <Route path="/admin/resources" element={<ResourceManager />} />
            </Routes>
          </div>
        </BrowserRouter>
      </RiskProvider>
    </LanguageProvider>
  )
}

export default App
