import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useRisk } from '../../context/RiskContext'

function Results() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { riskLevel } = useRisk()

  const getRiskAdvice = () => {
    switch (riskLevel) {
      case 'high':
        return {
          title: 'Immediate Safety Tips',
          items: [
            'If you\'re in immediate danger, call emergency services (999)',
            'Try to stay in a room with an exit - avoid kitchens, bathrooms, or garages',
            'Keep your phone charged and accessible',
            'Have a trusted neighbor aware of your situation',
            'Consider going to a public place or shelter'
          ]
        }
      case 'medium':
        return {
          title: 'Safety Planning',
          items: [
            'Identify safe spaces in your home',
            'Keep important documents in an accessible place',
            'Establish a code word with trusted friends/family',
            'Save emergency numbers in your phone',
            'Consider speaking with a counselor'
          ]
        }
      default:
        return {
          title: 'Support Resources',
          items: [
            'Reach out to trusted friends or family',
            'Consider counseling or support groups',
            'Learn about healthy relationships',
            'Keep emergency contacts handy',
            'Remember: you deserve to feel safe'
          ]
        }
    }
  }

  const advice = getRiskAdvice()

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card-custom mb-4">
            <h3 className="mb-4" style={{ color: 'var(--color-primary-light)' }}>
              {t('results.title') || 'Support Results'}
            </h3>

            {/* Risk-based advice */}
            <div className={`p-3 mb-4 rounded ${
              riskLevel === 'high' ? 'bg-danger bg-opacity-25 border border-danger' :
              riskLevel === 'medium' ? 'bg-warning bg-opacity-25 border border-warning' :
              'bg-success bg-opacity-25 border border-success'
            }`}>
              <h5 className="mb-3">{advice.title}</h5>
              <ul className="mb-0">
                {advice.items.map((item, index) => (
                  <li key={index} className="mb-2">{item}</li>
                ))}
              </ul>
            </div>

            {/* Quick contacts */}
            <div className="mb-4">
              <h5 className="mb-3">Emergency Contacts</h5>
              <div className="d-grid gap-2">
                <a 
                  href="tel:999" 
                  className="btn btn-danger btn-sm"
                >
                  🚨 Emergency: 999
                </a>
                <a 
                  href="tel:08001234567" 
                  className="btn btn-outline-light btn-sm"
                >
                  📞 GBV Hotline: 0800 123 4567
                </a>
              </div>
            </div>

            <div className="d-grid gap-2">
              <button
                className="btn btn-primary-custom"
                onClick={() => navigate('/resources')}
              >
                📍 View Local Resources
              </button>
              
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate('/chat')}
                style={{ 
                  borderColor: 'var(--color-primary-border)',
                  color: 'var(--color-primary-light)'
                }}
              >
                ← Back to Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Results
