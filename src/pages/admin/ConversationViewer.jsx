import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Sample conversations (will come from backend)
const sampleConversations = [
  {
    id: 1,
    date: '2024-01-15 14:30',
    riskLevel: 'high',
    preview: 'I\'m scared, he threatened to kill me...',
    flagged: true
  },
  {
    id: 2,
    date: '2024-01-15 13:15',
    riskLevel: 'medium',
    preview: 'He controls all the money and won\'t let me...',
    flagged: true
  },
  {
    id: 3,
    date: '2024-01-15 11:45',
    riskLevel: 'low',
    preview: 'I just need someone to talk to about...',
    flagged: false
  },
  {
    id: 4,
    date: '2024-01-15 10:20',
    riskLevel: 'high',
    preview: 'He hit me last night and I don\'t know...',
    flagged: true
  },
  {
    id: 5,
    date: '2024-01-14 16:50',
    riskLevel: 'medium',
    preview: 'I think he\'s following me when I leave...',
    flagged: false
  },
]

function ConversationViewer() {
  const navigate = useNavigate()
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [filter, setFilter] = useState('all')

  const getRiskBadge = (level) => {
    const colors = {
      high: 'bg-danger',
      medium: 'bg-warning',
      low: 'bg-success'
    }
    return colors[level] || 'bg-secondary'
  }

  const filteredConversations = filter === 'all' 
    ? sampleConversations 
    : sampleConversations.filter(c => c.riskLevel === filter)

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
                All ({sampleConversations.length})
              </button>
              <button
                className={`btn btn-sm ${filter === 'high' ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => setFilter('high')}
              >
                High Risk ({sampleConversations.filter(c => c.riskLevel === 'high').length})
              </button>
              <button
                className={`btn btn-sm ${filter === 'medium' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setFilter('medium')}
              >
                Medium Risk ({sampleConversations.filter(c => c.riskLevel === 'medium').length})
              </button>
              <button
                className={`btn btn-sm ${filter === 'low' ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => setFilter('low')}
              >
                Low Risk ({sampleConversations.filter(c => c.riskLevel === 'low').length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="row">
        <div className="col-12">
          <div className="card-custom card-admin">
            <div className="list-group list-group-flush">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
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
                        <span className={`badge ${getRiskBadge(conv.riskLevel)}`}>
                          {conv.riskLevel.toUpperCase()}
                        </span>
                        {conv.flagged && (
                          <span className="badge bg-warning text-dark">
                            ⚠️ Flagged
                          </span>
                        )}
                        <small className="text-muted">{conv.date}</small>
                      </div>
                      <p className="mb-0" style={{ color: 'var(--color-text)' }}>
                        {conv.preview}
                      </p>
                    </div>
                    <span className="text-muted">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Detail Modal */}
      {selectedConversation && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ backgroundColor: '#1a1a1a', border: '1px solid var(--color-admin-border)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--color-admin-border)' }}>
                <h5 className="modal-title" style={{ color: 'var(--color-admin-light)' }}>
                  Conversation #{selectedConversation.id}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedConversation(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  <strong>Date:</strong> {selectedConversation.date} | 
                  <strong> Risk Level:</strong> <span className={
                    selectedConversation.riskLevel === 'high' ? 'text-danger' :
                    selectedConversation.riskLevel === 'medium' ? 'text-warning' : 'text-success'
                  }>{selectedConversation.riskLevel.toUpperCase()}</span>
                </p>
                <div className="p-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <p className="mb-2">
                    <strong>User:</strong> {selectedConversation.preview}
                  </p>
                  <p className="text-muted">
                    <em>[Full conversation would be displayed here - data from backend]</em>
                  </p>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--color-admin-border)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedConversation(null)}
                >
                  Close
                </button>
                <button type="button" className="btn btn-primary">
                  Export Case
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
