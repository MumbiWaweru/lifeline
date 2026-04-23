import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/api'
import { STORAGE_KEYS } from '../../config'

function Alerts() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAlerts = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
      
      if (!token) {
        navigate('/admin/login')
        return
      }

      try {
        setLoading(true)
        const data = await adminApi.getAlerts(token)
        setAlerts(data.alerts || [])
      } catch (err) {
        console.error('Failed to fetch alerts:', err)
        setError('Failed to load alerts')
        
        if (err.message.includes('401')) {
          localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
          navigate('/admin/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [navigate])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3" style={{ color: 'var(--color-text-secondary)' }}>Loading alerts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="row mb-4">
        <div className="col-md-8">
          <h2 style={{ color: '#f97316' }}>
            🚨 High Risk Alerts
          </h2>
          <p className="text-muted">Critical incidents requiring immediate attention</p>
        </div>
        <div className="col-md-4 text-end">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate('/admin/dashboard')}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card-custom card-admin">
            {alerts.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No alerts at this time.</p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="list-group-item"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      marginBottom: '1rem',
                      borderRadius: '12px'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex gap-2 align-items-center mb-2">
                          <span className="badge bg-danger">
                            🔴 HIGH RISK
                          </span>
                          <small className="text-muted">{formatDate(alert.created_at)}</small>
                        </div>
                        <p className="mb-2" style={{ color: 'var(--color-text)' }}>
                          <strong>Session:</strong> {alert.session_id}
                        </p>
                        {alert.message_preview && (
                          <p className="mb-0" style={{ color: 'var(--color-text-secondary)' }}>
                            <strong>Message Preview:</strong> {alert.message_preview}...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="alert alert-warning">
              <strong>⚠️ Important:</strong> These alerts indicate high-risk situations. 
              Ensure appropriate follow-up actions are taken and maintain confidentiality at all times.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Alerts
