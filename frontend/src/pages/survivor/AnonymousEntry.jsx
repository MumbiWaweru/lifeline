import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

// SVG Icons
const IconShield = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IconLock = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconUser = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconMessage = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)

function AnonymousEntry() {
  const navigate = useNavigate()
  const { language } = useLanguage()

  const features = [
    { Icon: IconLock, label: language === 'sw' ? 'Hakuna Akaunti' : 'No Account Required' },
    { Icon: IconUser, label: language === 'sw' ? '100% Haijulikani' : '100% Anonymous' },
    { Icon: IconShield, label: language === 'sw' ? 'Msimbo wa Siri' : 'End-to-End Encrypted' },
    { Icon: IconMessage, label: language === 'sw' ? 'Mazungumzo ya Siri' : 'Private Conversation' },
  ]

  return (
    <div className="entry-page">
      <div className="entry-card">
        <div className="entry-shield">
          <IconShield />
        </div>

        <h2 className="entry-title">
          {language === 'sw' ? 'Salama & Siri' : 'Safe & Anonymous'}
        </h2>

        <p className="entry-body">
          {language === 'sw'
            ? 'Huhitaji kuunda akaunti au kutoa maelezo yoyote ya kibinafsi. Mazungumzo yako ni ya siri kabisa na hayahifadhiwa.'
            : "You don't need to create an account or share any personal information. Everything is encrypted and fully anonymous."
          }
        </p>

        <div className="feature-grid">
          {features.map(({ Icon, label }) => (
            <div key={label} className="fg-item">
              <div className="fg-icon-wrap">
                <Icon />
              </div>
              <div className="fg-label">{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="cta-primary" onClick={() => navigate('/chat')}>
            {language === 'sw' ? 'Endelea kwenye Mazungumzo' : 'Start Safe Chat'} <IconArrow />
          </button>
          <button className="cta-secondary" onClick={() => navigate('/')}>
            {language === 'sw' ? 'Rudi Nyumbani' : 'Back to Home'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AnonymousEntry