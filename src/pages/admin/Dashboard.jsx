import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

function Dashboard() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const stats = {
    totalConversations: 156,
    highRisk: 23,
    mediumRisk: 45,
    lowRisk: 88,
    todayConversations: 12
  }

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    navigate('/')
  }

  return (
    <div className="container">
      <div className="row mb-4">
        <div className="col-md-8">
          <h2 className="text-gradient">Dashboard Overview</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Welcome back, Administrator</p>
        </div>
        <div className="col-md-4 text-end">
          <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value">{stats.totalConversations}</div>
            <div className="stat-label">Total Conversations</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-risk-high)' }}>{stats.highRisk}</div>
            <div className="stat-label">High Risk Cases</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-risk-medium)' }}>{stats.mediumRisk}</div>
            <div className="stat-label">Medium Risk</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-risk-low)' }}>{stats.lowRisk}</div>
            <div className="stat-label">Low Risk</div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card-custom card-admin">
            <h4 className="mb-3" style={{ color: 'var(--color-text)' }}>
              Today's Activity
            </h4>
            <div className="row">
              <div className="col-md-6">
                <p style={{ color: 'var(--color-text-muted)' }}>Conversations Today</p>
                <p className="h2" style={{ color: 'var(--color-text)' }}>{stats.todayConversations}</p>
              </div>
              <div className="col-md-6">
                <p style={{ color: 'var(--color-text-muted)' }}>Flagged for Review</p>
                <p className="h2" style={{ color: 'var(--color-risk-medium)' }}>5</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-4">
          <button
            className="btn-primary-custom w-100"
            onClick={() => navigate('/admin/conversations')}
          >
            💬 View Conversations
          </button>
        </div>
        <div className="col-md-4">
          <button
            className="btn-primary-custom w-100"
            onClick={() => navigate('/admin/resources')}
          >
            📋 Manage Resources
          </button>
        </div>
        <div className="col-md-4">
          <button
            className="btn btn-outline-secondary w-100"
            style={{ 
              borderColor: 'var(--border-color)', 
              color: 'var(--color-text-secondary)' 
            }}
          >
            📊 View Reports
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
