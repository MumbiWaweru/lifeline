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
      case 'red':
        return {
          title: '🚨 Immediate Safety Tips',
          color: 'danger',
          items: [
            'If you\'re in immediate danger, call emergency services (999)',
            'Try to stay in a room with an exit - avoid kitchens, bathrooms, or garages',
            'Keep your phone charged and accessible',
            'Have a trusted neighbor aware of your situation',
            'Consider going to a public place or shelter'
          ]
        }
      case 'medium':
      case 'amber':
        return {
          title: '⚠️ Safety Planning',
          color: 'warning',
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
          title: '💚 Support Resources',
          color: 'success',
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
            <h3 className="mb-4 text-gradient">
              📋 Support Results
            </h3>

            <div className={`p-4 mb-4 rounded-4 border ${
              advice.color === 'danger' ? 'bg-danger bg-opacity-10 border-danger' :
              advice.color === 'warning' ? 'bg-warning bg-opacity-10 border-warning' :
              'bg-success bg-opacity-10 border-success'
            }`}>
              <h5 className="mb-3">{advice.title}</h5>
              <ul className="mb-0" style={{ paddingLeft: '1.25rem' }}>
                {advice.items.map((item, index) => (
                  <li key={index} className="mb-2" style={{ color: 'var(--color-text-secondary)' }}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="mb-4">
              <h5 className="mb-3">📞 Emergency Contacts</h5>
              <div className="d-grid gap-2">
                <a 
                  href="tel:999" 
                  className="btn btn-danger btn-sm py-3"
                  style={{ borderRadius: '12px', fontWeight: '600' }}
                >
                  🚨 Emergency: 999
                </a>
                <a 
                  href="tel:08001234567" 
                  className="btn btn-outline-light btn-sm py-3"
                  style={{ 
                    borderRadius: '12px', 
                    borderColor: 'var(--border-color)',
                    color: 'var(--color-text)'
                  }}
                >
                  📞 GBV Hotline: 0800 123 4567
                </a>
              </div>
            </div>

            <div className="d-grid gap-2">
              <button
                className="btn-primary-custom"
                onClick={() => navigate('/resources')}
              >
                📍 View Local Resources
              </button>
              
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate('/chat')}
                style={{ 
                  borderColor: 'var(--border-color)',
                  color: 'var(--color-text-secondary)'
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
