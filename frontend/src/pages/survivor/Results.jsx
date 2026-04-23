import { useNavigate } from 'react-router-dom'
import { useRisk } from '../../context/RiskContext'

// SVG step icons
const icons = {
  emergency: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  exit: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  phone: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  battery: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="16" height="10" rx="2" ry="2"/><line x1="22" y1="11" x2="22" y2="13"/><line x1="6" y1="11" x2="6" y2="13"/><line x1="10" y1="11" x2="10" y2="13"/></svg>,
  cross: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  doc: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  key: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  bag: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  scale: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M3 10l9-7 9 7"/><path d="M3 17h18"/></svg>,
  chat: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  heart: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  users: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  eye: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  robot: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/><circle cx="12" cy="5" r="1"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/><line x1="12" y1="19" x2="12" y2="19"/></svg>,
  phoneCall: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
}

const RISK_DATA = {
  red: {
    badge: 'IMMEDIATE CONCERN', badgeColor: '#b85040', badgeBg: '#faeae8', badgeBorder: 'rgba(184,80,64,.28)',
    headline: 'Your safety is the priority right now',
    intro: 'Based on your conversation, the AI has assessed your situation as high-risk. Please take these steps as soon as it is safe to do so.',
    iconColor: '#b85040', iconBg: '#faeae8',
    steps: [
      { icon: 'emergency', title: 'Call emergency services', desc: 'Call 999 immediately if you or someone else is in physical danger right now.' },
      { icon: 'exit', title: 'Move to safety', desc: 'If you can leave safely, do so. Avoid rooms without exits — kitchens, bathrooms, garages.' },
      { icon: 'phone', title: 'GBV Crisis Hotline: 1195', desc: 'Trained counselors available 24 hours, 7 days. Free, confidential, and anonymous.' },
      { icon: 'battery', title: 'Keep your phone accessible', desc: 'Charge it now. Consider storing an emergency contact or charger in a safe location.' },
      { icon: 'cross', title: 'Seek medical attention', desc: 'If you have been physically harmed, go to the nearest hospital or GVRC clinic.' },
      { icon: 'doc', title: 'Document if safe', desc: 'Photograph injuries and save threatening messages if it is safe. This can help legally later.' },
    ],
    contacts: [
      { label: 'Police Emergency', number: '999' },
      { label: 'GBV National Hotline', number: '1195' },
      { label: 'Wangu Kanja Foundation', number: '0711 200 400' },
    ]
  },
  amber: {
    badge: 'SAFETY PLANNING', badgeColor: '#b8843a', badgeBg: '#faf0dc', badgeBorder: 'rgba(184,132,58,.28)',
    headline: 'Build your safety plan now',
    intro: 'Your situation shows warning signs. Preparing now — before a crisis — gives you more options and control.',
    iconColor: '#b8843a', iconBg: '#faf0dc',
    steps: [
      { icon: 'key', title: 'Identify safe exits', desc: 'Know where the exits are in your home and have a clear plan if you need to leave quickly.' },
      { icon: 'users', title: 'Choose a trusted contact', desc: 'Select one person you trust. Agree on a code word that signals you need them to help.' },
      { icon: 'bag', title: 'Prepare a go-bag', desc: 'Pack ID, phone charger, medications, some cash, and key documents somewhere accessible.' },
      { icon: 'doc', title: 'Secure your documents', desc: 'Keep copies of ID, birth certificate, and financial records somewhere outside your home.' },
      { icon: 'scale', title: 'Know your rights', desc: 'You can get a free protection order from the magistrate\'s court. Organizations can help.' },
      { icon: 'chat', title: 'Consider counseling', desc: 'A counselor can help you process your situation safely and plan your next steps.' },
    ],
    contacts: [
      { label: 'GBV National Hotline', number: '1195' },
      { label: 'Kituo cha Sheria (Legal Aid)', number: '0800 720 185' },
      { label: 'COVAW Kenya', number: '0719 638 006' },
    ]
  },
  green: {
    badge: 'SUPPORT RESOURCES', badgeColor: '#5a8a60', badgeBg: '#eaf2eb', badgeBorder: 'rgba(90,138,96,.28)',
    headline: 'You took a brave step',
    intro: 'Even without immediate danger, reaching out takes courage. Here are resources to support your wellbeing and strengthen your safety awareness.',
    iconColor: '#5a8a60', iconBg: '#eaf2eb',
    steps: [
      { icon: 'heart', title: 'You deserve to feel safe', desc: 'Healthy relationships are built on respect, trust, and equality — not fear or control.' },
      { icon: 'users', title: 'Connect with others', desc: 'Support groups and community spaces can be deeply healing for survivors.' },
      { icon: 'eye', title: 'Learn the early signs', desc: 'Recognize warning patterns: controlling behavior, isolation, jealousy, financial abuse.' },
      { icon: 'chat', title: 'Talk to someone', desc: 'A counselor or trusted friend provides a space to process your feelings without judgment.' },
      { icon: 'phone', title: 'Save key numbers now', desc: 'Store emergency and support numbers in your phone today, while you are calm.' },
      { icon: 'scale', title: 'Legal protection exists', desc: 'You can report abuse and access legal protection — organizations will guide you through it.' },
    ],
    contacts: [
      { label: 'GBV National Hotline', number: '1195' },
      { label: 'Childline Kenya', number: '116' },
      { label: 'Women of Success', number: '0700 300 277' },
    ]
  }
}

function Results() {
  const navigate = useNavigate()
  const { riskLevel } = useRisk()
  const level = ['red','amber','green'].includes(riskLevel) ? riskLevel
    : riskLevel === 'high' ? 'red' : riskLevel === 'medium' ? 'amber' : 'green'
  const data = RISK_DATA[level] || RISK_DATA.green

  return (
    <div className="results-page">
      <div className="results-container">
        <div className="results-header">
          <button className="back-btn" onClick={() => navigate('/chat')}>← Back to Chat</button>
          <div className="results-level-badge" style={{ color: data.badgeColor, background: data.badgeBg, borderColor: data.badgeBorder }}>
            <span className="badge-pulse-dot" style={{ background: data.badgeColor }} />
            {data.badge}
          </div>
        </div>

        <h1 className="results-headline">{data.headline}</h1>
        <p className="results-intro">{data.intro}</p>

        <div className="steps-grid">
          {data.steps.map((step, i) => (
            <div key={i} className="step-card" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="step-icon-wrap" style={{ background: data.iconBg }}>
                {icons[step.icon] ? icons[step.icon](data.iconColor) : null}
              </div>
              <div>
                <div className="step-title">{step.title}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="emergency-panel">
          <div className="ep-label">Emergency & Support Contacts</div>
          <div className="ep-contacts">
            {data.contacts.map((c, i) => (
              <a key={i} href={`tel:${c.number.replace(/\s/g,'')}`} className="ep-contact">
                <div className="ep-contact-icon">{icons.phoneCall('#6b8f71')}</div>
                <span className="ep-contact-label">{c.label}</span>
                <span className="ep-contact-number">{c.number}</span>
                <span className="ep-contact-cta">Tap to call →</span>
              </a>
            ))}
          </div>
        </div>

        <div className="ai-disclaimer">
          {icons.robot('var(--text-3)')}
          This risk assessment is AI-generated based on your conversation. It is a support tool, not a clinical diagnosis. Always trust your own instincts about your safety.
        </div>

        <div className="results-ctas">
          <button className="cta-primary" onClick={() => navigate('/resources')}>
            View Local Support Resources
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