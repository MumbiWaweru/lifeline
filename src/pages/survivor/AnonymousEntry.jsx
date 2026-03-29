import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

function AnonymousEntry() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const handleContinue = () => {
    navigate('/chat')
  }

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-8 col-lg-6">
          <div className="card-custom anonymous-card">
            <span className="anonymous-icon">🙋</span>
            
            <h2 className="mb-3 text-gradient">
              Anonymous & Confidential
            </h2>
            
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              You don't need to create an account or provide any personal information.
              Your conversation is completely anonymous and will not be stored.
            </p>

            <div className="feature-grid">
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <div className="feature-text">No Account Required</div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">👤</span>
                <div className="feature-text">100% Anonymous</div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🛡️</span>
                <div className="feature-text">Encrypted</div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💬</span>
                <div className="feature-text">Private Chat</div>
              </div>
            </div>

            <div className="d-grid gap-3 mt-4">
              <button
                className="btn-primary-custom btn-lg w-100"
                onClick={handleContinue}
              >
                Continue to Chat →
              </button>
              
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate('/')}
                style={{ 
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnonymousEntry
