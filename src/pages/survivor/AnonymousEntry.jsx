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
          <div className="card-custom text-center">
            <div className="mb-4">
              <span style={{ fontSize: '4rem' }}>🙋</span>
            </div>
            
            <h2 className="mb-3" style={{ color: 'var(--color-primary-light)' }}>
              Anonymous & Confidential
            </h2>
            
            <p className="text-muted mb-4">
              You don't need to create an account or provide any personal information.
              Your conversation is completely anonymous and will not be stored.
            </p>

            <div className="row g-3 mb-4">
              <div className="col-6">
                <div className="p-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <span className="d-block mb-2">🔒</span>
                  <small>No Account Required</small>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <span className="d-block mb-2">👤</span>
                  <small>100% Anonymous</small>
                </div>
              </div>
            </div>

            <div className="d-grid gap-2">
              <button
                className="btn btn-primary-custom btn-lg"
                onClick={handleContinue}
              >
                Continue to Chat
              </button>
              
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate('/')}
                style={{ 
                  borderColor: 'var(--color-primary-border)',
                  color: 'var(--color-primary-light)'
                }}
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnonymousEntry
