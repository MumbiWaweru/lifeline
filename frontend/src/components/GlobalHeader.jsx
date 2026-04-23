import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useRisk } from '../context/RiskContext'

const RISK_COLORS = {
  green:  { color: '#5a8a60', bg: '#eaf2eb', border: 'rgba(90,138,96,.3)',   label: 'Low Risk'    },
  low:    { color: '#5a8a60', bg: '#eaf2eb', border: 'rgba(90,138,96,.3)',   label: 'Low Risk'    },
  amber:  { color: '#b8843a', bg: '#faf0dc', border: 'rgba(184,132,58,.3)',  label: 'Medium Risk' },
  medium: { color: '#b8843a', bg: '#faf0dc', border: 'rgba(184,132,58,.3)',  label: 'Medium Risk' },
  red:    { color: '#b85040', bg: '#faeae8', border: 'rgba(184,80,64,.3)',   label: 'High Risk'   },
  high:   { color: '#b85040', bg: '#faeae8', border: 'rgba(184,80,64,.3)',   label: 'High Risk'   },
}

const IconExit   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
const IconGlobe  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
const IconLeaf   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22c1.25-1.25 2.5-2.5 3.75-2.5C9 19.5 9 22 12.25 22c3.25 0 3.25-2.5 6.5-2.5S22 22 22 22"/><path d="M2.5 2.5c0 0 5 0 8 5s5 7.5 8 8.5"/></svg>
const IconHelp   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>

function GlobalHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const { language, toggleLanguage } = useLanguage()
  const { riskLevel } = useRisk()
  const isAdmin = location.pathname.startsWith('/admin')

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') window.location.replace('https://www.google.com')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const riskStyle = RISK_COLORS[riskLevel] || RISK_COLORS.green

  return (
    <header className="global-header-v2">
      <div className="gh2-left">
        <button
          className="gh2-exit-btn"
          onClick={() => window.location.replace('https://www.google.com')}
          title="Press Esc to exit instantly"
        >
          <IconExit />
          Quick Exit <kbd>Esc</kbd>
        </button>
      </div>

      <div className="gh2-center">
        <button className="gh2-brand" onClick={() => navigate('/')}>
          <div className="gh2-brand-mark">
            <IconLeaf />
          </div>
          Lifeline
        </button>
      </div>

      <div className="gh2-right">
        {/* Help link — only shown on survivor pages */}
        {!isAdmin && (
          <button
            className="gh2-lang-btn"
            onClick={() => navigate('/help')}
            title="Help & user guide"
            style={{ gap: 6 }}
          >
            <IconHelp />
            Help
          </button>
        )}

        {!isAdmin && riskLevel && (
          <div
            className="gh2-risk"
            style={{
              color: riskStyle.color,
              background: riskStyle.bg,
              borderColor: riskStyle.border,
            }}
          >
            <span className="gh2-risk-dot" style={{ background: riskStyle.color }} />
            {riskStyle.label}
          </div>
        )}

        <button className="gh2-lang-btn" onClick={toggleLanguage}>
          <IconGlobe />
          {language === 'en' ? 'EN' : 'SW'}
        </button>
      </div>
    </header>
  )
}

export default GlobalHeader