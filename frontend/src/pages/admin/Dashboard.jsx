import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

function Dashboard() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  // Sample stats (will come from backend)
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
          <h2 style={{ color: 'var(--color-admin-light)' }}>Dashboard Overview</h2>
          <p className="text-muted">Welcome back, Administrator</p>
        </div>
        <div className="col-md-4 text-end">
          <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card-custom card-admin text-center">
            <h3 className="display-4" style={{ color: 'var(--color-admin-light)' }}>
              {stats.totalConversations}
            </h3>
            <p className="text-muted mb-0">Total Conversations</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-custom card-admin text-center">
            <h3 className="display-4 text-danger">{stats.highRisk}</h3>
            <p className="text-muted mb-0">High Risk Cases</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-custom card-admin text-center">
            <h3 className="display-4 text-warning">{stats.mediumRisk}</h3>
            <p className="text-muted mb-0">Medium Risk</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-custom card-admin text-center">
            <h3 className="display-4 text-success">{stats.lowRisk}</h3>
            <p className="text-muted mb-0">Low Risk</p>
          </div>
        </div>
      </div>

      {/* Today's Activity */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card-custom card-admin">
            <h4 className="mb-3" style={{ color: 'var(--color-admin-light)' }}>
              Today's Activity
            </h4>
            <div className="row">
              <div className="col-md-6">
                <p className="mb-1 text-muted">Conversations Today</p>
                <p className="h3">{stats.todayConversations}</p>
              </div>
              <div className="col-md-6">
                <p className="mb-1 text-muted">Flagged for Review</p>
                <p className="h3 text-warning">5</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row g-3">
        <div className="col-md-4">
          <button
            className="btn btn-primary-custom w-100"
            onClick={() => navigate('/admin/conversations')}
          >
            💬 View Conversations
          </button>
        </div>
        <div className="col-md-4">
          <button
            className="btn btn-primary-custom w-100"
            onClick={() => navigate('/admin/resources')}
          >
            📋 Manage Resources
          </button>
        </div>
        <div className="col-md-4">
          <button
            className="btn btn-outline-secondary w-100"
            style={{ borderColor: 'var(--color-admin-border)', color: 'var(--color-admin-light)' }}
          >
            📊 View Reports
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
