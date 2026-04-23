import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { RiskProvider } from './context/RiskContext'
import GlobalHeader from './components/GlobalHeader'

import Landing from './pages/Landing'
import AnonymousEntry from './pages/survivor/AnonymousEntry'
import Chatbot from './pages/survivor/Chatbot'
import Results from './pages/survivor/Results'
import Resources from './pages/survivor/Resources'
import Help from './pages/survivor/Help'           // NEW — Criterion 7

import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import ConversationViewer from './pages/admin/ConversationViewer'
import ResourceManager from './pages/admin/ResourceManager'
import Testing from './pages/admin/Testing'         // NEW — Criterion 6
import DatabaseDesign from './pages/admin/DatabaseDesign' // NEW — Criterion 4
import Reports from './pages/admin/Reports'          // NEW — Criterion 8

function App() {
  return (
    <LanguageProvider>
      <RiskProvider>
        <BrowserRouter>
          <GlobalHeader />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/entry" element={<AnonymousEntry />} />
            <Route path="/chat" element={<Chatbot />} />
            <Route path="/results" element={<Results />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/help" element={<Help />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/conversations" element={<ConversationViewer />} />
            <Route path="/admin/resources" element={<ResourceManager />} />
            <Route path="/admin/testing" element={<Testing />} />
            <Route path="/admin/database" element={<DatabaseDesign />} />
            <Route path="/admin/reports" element={<Reports />} />
          </Routes>
        </BrowserRouter>
      </RiskProvider>
    </LanguageProvider>
  )
}

export default App