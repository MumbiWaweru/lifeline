import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

function Landing() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-8 col-lg-6">
          <div className="text-center mb-5">
            <h1 className="display-4 mb-3" style={{ color: 'var(--color-primary-light)' }}>
              {t('landing.title')}
            </h1>
            <p className="lead mb-4" style={{ color: 'var(--color-primary-border)' }}>
              {t('landing.subtitle')}
            </p>
            <p className="text-muted mb-5">
              {t('landing.description')}
            </p>
          </div>

          <div className="d-grid gap-3">
            <button
              className="btn btn-primary-custom btn-lg"
              onClick={() => navigate('/entry')}
            >
              🤝 {t('landing.survivorButton')}
            </button>
            
            <button
              className="btn btn-outline-secondary btn-lg"
              style={{ 
                borderColor: 'var(--color-admin-border)',
                color: 'var(--color-admin-light)'
              }}
              onClick={() => navigate('/admin/login')}
            >
              🔐 {t('landing.adminButton')}
            </button>
          </div>

          <div className="mt-5 text-center">
            <small className="text-muted">
              Your privacy and safety are our priority. All conversations are confidential.
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing
