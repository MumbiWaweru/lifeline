import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import RiskIndicator from './RiskIndicator'
import LanguageToggle from './LanguageToggle'

function GlobalHeader() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const handleQuickExit = () => {
    window.location.href = 'https://www.google.com'
  }

  return (
    <header className="global-header">
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="col-md-4">
            <button 
              className="quick-exit-btn"
              onClick={handleQuickExit}
            >
              {t('quickExit') || 'Quick Exit'}
            </button>
          </div>
          
          <div className="col-md-4 text-center">
            <RiskIndicator />
          </div>
          
          <div className="col-md-4 d-flex justify-content-end">
            <LanguageToggle />
          </div>
        </div>
      </div>
    </header>
  )
}

export default GlobalHeader
