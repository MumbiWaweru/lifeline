import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

function Landing() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="landing-hero">
      <div className="landing-content">
        <h1 className="landing-title">Lifeline</h1>
        <p className="landing-subtitle">Confidential GBV Support</p>
        <p className="landing-description">
          Get immediate support and connect with local resources. 
          Your safety is our priority. Completely anonymous and confidential.
        </p>

        <div className="landing-buttons">
          <button
            className="btn-landing-primary"
            onClick={() => navigate('/entry')}
          >
            🤝 I Need Help
          </button>
          
          <button
            className="btn-landing-secondary"
            onClick={() => navigate('/admin/login')}
          >
            🔐 Admin Login
          </button>
        </div>

        <div className="mt-5">
          <small style={{ color: 'var(--color-text-muted)' }}>
            🔒 Your privacy and safety are our priority. All conversations are confidential.
          </small>
        </div>
      </div>
    </div>
  )
}

export default Landing
