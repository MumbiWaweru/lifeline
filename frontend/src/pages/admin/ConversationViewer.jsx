import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/api'
import { STORAGE_KEYS } from '../../config'

function ConversationViewer() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchConversations = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
      
      if (!token) {
        navigate('/admin/login')
        return
      }

      try {
        setLoading(true)
        const flaggedOnly = filter === 'flagged'
        const data = await adminApi.getConversations(token, flaggedOnly)
        setConversations(data.conversations || [])
      } catch (err) {
        console.error('Failed to fetch conversations:', err)
        setError('Failed to load conversations')
        
        if (err.message.includes('401')) {
          localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
          navigate('/admin/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [navigate, filter])

  const getRiskBadge = (level) => {
    const colors = {
      red: 'bg-danger',
      amber: 'bg-warning',
      green: 'bg-success'
    }
    return colors[level] || 'bg-secondary'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3" style={{ color: 'var(--color-text-secondary)' }}>Loading conversations...</p>
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
          <h2 style={{ color: 'var(--color-admin-light)' }}>
            Conversation Viewer
          </h2>
          <p className="text-muted">Review flagged cases and conversation history</p>
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

      {/* Filter */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card-custom card-admin">
            <div className="d-flex gap-2 flex-wrap">
              <button
                className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter('all')}
              >
                All ({conversations.length})
              </button>
              <button
                className={`btn btn-sm ${filter === 'flagged' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setFilter('flagged')}
              >
                Flagged ({conversations.filter(c => c.flagged).length})
              </button>
              <button
                className={`btn btn-sm ${filter === 'red' ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => setFilter('red')}
              >
                High Risk ({conversations.filter(c => c.risk_level === 'red').length})
              </button>
              <button
                className={`btn btn-sm ${filter === 'amber' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setFilter('amber')}
              >
                Medium Risk ({conversations.filter(c => c.risk_level === 'amber').length})
              </button>
              <button
                className={`btn btn-sm ${filter === 'green' ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => setFilter('green')}
              >
                Low Risk ({conversations.filter(c => c.risk_level === 'green').length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="row">
        <div className="col-12">
          <div className="card-custom card-admin">
            {conversations.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No conversations found.</p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {conversations.map((conv) => (
                  <div
                    key={conv.session_id}
                    className="list-group-item list-group-item-action"
                    onClick={() => setSelectedConversation(conv)}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid var(--color-admin-border)',
                      cursor: 'pointer'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="d-flex gap-2 align-items-center mb-1">
                          <span className={`badge ${getRiskBadge(conv.risk_level)}`}>
                            {conv.risk_level.toUpperCase()}
                          </span>
                          {conv.flagged && (
                            <span className="badge bg-warning text-dark">
                              ⚠️ Flagged
                            </span>
                          )}
                          <small className="text-muted">{formatDate(conv.timestamp)}</small>
                        </div>
                        <p className="mb-0" style={{ color: 'var(--color-text)' }}>
                          Session: {conv.session_id}
                        </p>
                        {conv.messages && conv.messages.length > 0 && (
                          <small className="text-muted">
                            {conv.messages.length} messages | Last: {conv.messages[conv.messages.length - 1]?.content?.substring(0, 100)}...
                          </small>
                        )}
                      </div>
                      <span className="text-muted">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Detail Modal */}
      {selectedConversation && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ backgroundColor: '#1a1a1a', border: '1px solid var(--color-admin-border)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--color-admin-border)' }}>
                <h5 className="modal-title" style={{ color: 'var(--color-admin-light)' }}>
                  Conversation
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedConversation(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  <strong>Session:</strong> {selectedConversation.session_id} |
                  <strong> Risk Level:</strong> <span className={
                    selectedConversation.risk_level === 'red' ? 'text-danger' :
                    selectedConversation.risk_level === 'amber' ? 'text-warning' : 'text-success'
                  }>{selectedConversation.risk_level.toUpperCase()}</span> |
                  <strong> Language:</strong> {selectedConversation.language}
                </p>
                
                {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                  <div className="p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {selectedConversation.messages.map((msg, idx) => (
                      <div key={idx} className="mb-3">
                        <strong style={{ color: msg.sender === 'user' ? 'var(--color-primary-light)' : 'var(--color-admin-light)' }}>
                          {msg.sender === 'user' ? 'User' : 'Assistant'}:
                        </strong>
                        <p className="mb-0 mt-1" style={{ color: 'var(--color-text)' }}>
                          {msg.content}
                        </p>
                        <small className="text-muted">{formatDate(msg.timestamp)}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No messages in this conversation.</p>
                )}
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--color-admin-border)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedConversation(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConversationViewer
