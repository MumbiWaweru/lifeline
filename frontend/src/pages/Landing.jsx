import { useNavigate } from 'react-router-dom'

// SVG icon components — no emojis
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)

function Landing() {
  const navigate = useNavigate()

  const stats = [
    { number: '39%', text: 'of Kenyan women aged 15-49 have experienced physical violence', source: 'Kenya Demographic & Health Survey, 2022' },
  ]

  const features = [
    {
      icon: IconShield,
      title: 'AI Risk Assessment',
      desc: 'Natural language processing classifies urgency level in real-time'
    },
    {
      icon: IconLock,
      title: 'Safe Communication',
      desc: 'Anonymous, encrypted connection to verified counselors'
    },
    {
      icon: IconUser,
      title: 'No Account Needed',
      desc: 'Complete anonymity — no personal information required'
    },
    {
      icon: IconClock,
      title: '24/7 Resources',
      desc: 'Location-aware recommendations for local support services'
    },
  ]

  return (
    <div className="landing-hero">
      <div className="landing-container">
        {/* Main Hero Section */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Safe · Confidential · Anonymous
          </div>

          <h1 className="hero-title">
            You deserve<br />
            to feel <span className="hero-highlight">safe.</span>
          </h1>

          <p className="hero-subtitle">
            Lifeline is a confidential AI-powered support platform for survivors of gender-based violence in Kenya. Get immediate risk assessment, safety guidance, and connect with local resources — without sharing your identity.
          </p>

          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={() => navigate('/chat')}>
              I Need Help Now <IconArrow />
            </button>
            <button className="btn-hero-secondary" onClick={() => navigate('/admin/login')}>
              Admin Portal
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          {stats.map((stat, i) => (
            <div key={i} className="stat-box">
              <div className="stat-number">{stat.number}</div>
              <p className="stat-text">{stat.text}</p>
              <p className="stat-source">{stat.source}</p>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="features-section">
          <h2 className="section-title">How Lifeline Supports You</h2>
          <div className="features-grid">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="feature-card">
                  <div className="feature-icon">
                    <Icon />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-desc">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-final">
          <h2>Ready to get support?</h2>
          <p>Click below to start a confidential conversation. Everything is anonymous and secure.</p>
          <button className="btn-hero-primary btn-large" onClick={() => navigate('/chat')}>
            Start Safe Chat <IconArrow />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Landing

