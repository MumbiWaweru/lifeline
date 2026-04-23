import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useRisk } from '../../context/RiskContext'

const RISK_DATA = {
  red: {
    badge: 'IMMEDIATE DANGER',
    badgeColor: '#ef4444',
    headline: 'Your Safety is the Priority Right Now',
    intro: 'Based on your conversation, the AI has assessed your situation as high-risk. Please take these steps immediately.',
    steps: [
      { icon: '🚨', title: 'Call Emergency Services', desc: 'Call 999 immediately if you or someone else is in physical danger right now.' },
      { icon: '📞', title: 'GBV Crisis Hotline: 1195', desc: 'Trained counselors available 24/7. Free, confidential, anonymous.' },
      { icon: '🚪', title: 'Leave if Safe to Do So', desc: 'Move toward exits. Avoid rooms with no escape — kitchens, bathrooms, garages.' },
      { icon: '📱', title: 'Keep Your Phone Accessible', desc: 'Charge it now. Consider hiding an emergency phone or charger in a safe place.' },
      { icon: '🏥', title: 'Medical Attention', desc: 'If you\'ve been physically harmed, go to the nearest hospital or GVRC clinic.' },
      { icon: '📄', title: 'Document Evidence', desc: 'If safe, photograph injuries, save threatening messages. This can help legally.' },
    ],
    emergency: [
      { label: 'Emergency', number: '999' },
      { label: 'GBV Hotline', number: '1195' },
      { label: 'Wangu Kanja Foundation', number: '0711 200 400' },
    ]
  },
  amber: {
    badge: 'MEDIUM RISK',
    badgeColor: '#f59e0b',
    headline: 'Build Your Safety Plan',
    intro: 'Your situation shows warning signs. Now is a good time to prepare — before a crisis. Having a plan gives you power.',
    steps: [
      { icon: '🗝', title: 'Identify Safe Exits', desc: 'Know where the exits are in your home and have a plan to leave quickly if needed.' },
      { icon: '👤', title: 'Trusted Contact', desc: 'Choose one trusted person. Create a code word that signals you need help.' },
      { icon: '📦', title: 'Go-Bag', desc: 'Prepare a bag with ID, phone charger, medications, some cash, and important documents.' },
      { icon: '💾', title: 'Secure Documents', desc: 'Keep copies of ID, birth certificate, and financial records somewhere outside the home.' },
      { icon: '⚖️', title: 'Know Your Rights', desc: 'You can get a protection order from the magistrate\'s court — it\'s free.' },
      { icon: '💬', title: 'Counseling', desc: 'Talking to a professional can help you process your situation and plan safely.' },
    ],
    emergency: [
      { label: 'GBV Hotline', number: '1195' },
      { label: 'Kituo cha Sheria (Legal Aid)', number: '0800 720 185' },
      { label: 'COVAW', number: '0719 638 006' },
    ]
  },
  green: {
    badge: 'LOW RISK',
    badgeColor: '#22c55e',
    headline: 'You\'re Taking a Brave Step',
    intro: 'Even without immediate danger, reaching out shows courage. Here are resources to support your wellbeing and safety awareness.',
    steps: [
      { icon: '❤️', title: 'You Deserve Safety', desc: 'Healthy relationships are built on respect, trust, and equality — not fear or control.' },
      { icon: '🤝', title: 'Support Groups', desc: 'Connecting with others who understand your experience can be deeply healing.' },
      { icon: '📚', title: 'Know the Signs', desc: 'Learn to recognize early warning signs of abuse — controlling behavior, isolation, jealousy.' },
      { icon: '💬', title: 'Talk to Someone', desc: 'A counselor or trusted friend can provide a space to process your feelings safely.' },
      { icon: '📞', title: 'Save Key Numbers', desc: 'Store emergency and support numbers in your phone now, when you\'re calm.' },
      { icon: '⚖️', title: 'Legal Protection', desc: 'You can report abuse and get legal protection — organizations will help you navigate this.' },
    ],
    emergency: [
      { label: 'GBV Hotline', number: '1195' },
      { label: 'Childline Kenya', number: '116' },
      { label: 'Women of Success', number: '0700 300 277' },
    ]
  }
}

function Results() {
  const navigate = useNavigate()
  const { riskLevel } = useRisk()

  const level = riskLevel === 'high' ? 'red' : riskLevel === 'medium' ? 'amber' : riskLevel === 'low' ? 'green' : (riskLevel || 'green')
  const data = RISK_DATA[level] || RISK_DATA.green

  return (
    <div className="results-page">
      <div className="results-container">
        {/* Header */}
        <div className="results-header">
          <button className="back-btn" onClick={() => navigate('/chat')}>
            ← Back to Chat
          </button>
          <div className="results-badge" style={{ background: `${data.badgeColor}20`, border: `1px solid ${data.badgeColor}50`, color: data.badgeColor }}>
            <span className="badge-pulse" style={{ background: data.badgeColor }} />
            {data.badge}
          </div>
        </div>

        <h1 className="results-headline">{data.headline}</h1>
        <p className="results-intro">{data.intro}</p>

        {/* Safety Steps */}
        <div className="steps-grid">
          {data.steps.map((step, i) => (
            <div key={i} className="step-card" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="step-icon">{step.icon}</div>
              <div className="step-content">
                <div className="step-title">{step.title}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Emergency Contacts */}
        <div className="emergency-panel">
          <div className="ep-label">Emergency & Support Contacts</div>
          <div className="ep-contacts">
            {data.emergency.map((e, i) => (
              <a key={i} href={`tel:${e.number.replace(/\s/g, '')}`} className="ep-contact">
                <span className="ep-contact-label">{e.label}</span>
                <span className="ep-contact-number">{e.number}</span>
                <span className="ep-contact-call">Tap to Call →</span>
              </a>
            ))}
          </div>
        </div>

        {/* AI Disclaimer */}
        <div className="ai-disclaimer">
          <span>🤖</span>
          Risk assessment is AI-generated based on your conversation. It is a support tool, not a professional clinical assessment.
          Always trust your own instincts about your safety.
        </div>

        {/* CTAs */}
        <div className="results-ctas">
          <button className="cta-primary" onClick={() => navigate('/resources')}>
            🗺 Find Local Support Resources
          </button>
          <button className="cta-secondary" onClick={() => navigate('/chat')}>
            Continue Chatting
          </button>
        </div>
      </div>
    </div>
  )
}

export default Results