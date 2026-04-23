import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

// SVG Icons
const IconChevron = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IconChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const IconMap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
)
const IconExit = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const IconPhone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)
const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const STEPS = {
  en: [
    { icon: <IconShield />, title: 'Start anonymously', desc: 'Click "I Need Help" on the home page. No account, no name, no personal details are ever required or stored.' },
    { icon: <IconChat />, title: 'Talk to the AI assistant', desc: 'Describe your situation in your own words — in English or Swahili. The AI reads your message, assesses your risk level, and replies with guidance.' },
    { icon: <IconMap />, title: 'Get your safety plan', desc: 'After chatting, click "View Safety Plan" to see personalised steps based on your risk level — low, medium, or high.' },
    { icon: <IconPhone />, title: 'Find local support', desc: 'Go to Resources to see verified hotlines, shelters, legal aid, and medical services near you. Every number is free to call.' },
    { icon: <IconExit />, title: 'Leave safely anytime', desc: 'Press the red "Quick Exit" button or the Esc key on your keyboard at any time. You will be taken to Google instantly — no trace left.' },
  ],
  sw: [
    { icon: <IconShield />, title: 'Anza bila kutambulika', desc: 'Bonyeza "Nahitaji Msaada" kwenye ukurasa wa nyumbani. Hakuna akaunti, hakuna jina, hakuna maelezo ya kibinafsi yanayohitajika.' },
    { icon: <IconChat />, title: 'Zungumza na msaidizi wa AI', desc: 'Eleza hali yako kwa maneno yako mwenyewe — kwa Kiingereza au Kiswahili. AI itasoma ujumbe wako na kukujibu na mwongozo.' },
    { icon: <IconMap />, title: 'Pata mpango wako wa usalama', desc: 'Baada ya mazungumzo, bonyeza "Ona Mpango wa Usalama" kuona hatua zinazofaa kwa kiwango chako cha hatari.' },
    { icon: <IconPhone />, title: 'Pata msaada wa karibu', desc: 'Nenda kwa Rasilimali kuona simu za dharura, makazi salama, msaada wa kisheria, na huduma za matibabu karibu nawe.' },
    { icon: <IconExit />, title: 'Ondoka salama wakati wowote', desc: 'Bonyeza kitufe nyekundu cha "Toka Haraka" au kitufe cha Esc kwenye kibodi yako wakati wowote.' },
  ]
}

const FAQS = {
  en: [
    { q: 'Is my conversation really anonymous?', a: 'Yes. Lifeline does not collect your name, phone number, location, or any identifying information. Each session is assigned a random ID that cannot be traced back to you. Even our administrators only see anonymised conversation data.' },
    { q: 'What does the risk level mean?', a: 'The AI analyses the language in your messages to assess your immediate safety. Green (Low) means no immediate danger detected. Amber (Medium) means warning signs are present and a safety plan is recommended. Red (High) means potential immediate danger — the system flags this for counselor attention and shows emergency contacts immediately.' },
    { q: 'Can I use Lifeline in Swahili?', a: 'Yes. Click the language button in the top right corner to switch between English and Swahili at any time. The AI will respond in whichever language you write in.' },
    { q: 'What if I am in immediate danger right now?', a: 'Call 999 (Kenya Police Emergency) immediately. The GBV National Hotline 1195 is also available 24 hours a day, 7 days a week, and is free to call from any network.' },
    { q: 'Does Lifeline replace professional counselling?', a: 'No. Lifeline is an AI-powered first-response tool. It can help you assess your situation, find resources, and take immediate steps — but it is not a substitute for professional counselling or legal advice. We encourage you to connect with a real counsellor through the Resources page.' },
    { q: 'Is my data shared with anyone?', a: 'No personal data is shared. Anonymised, aggregated statistics (e.g. total conversations, risk level distribution) are visible to verified administrators for service improvement purposes only. No conversation content is shared with third parties.' },
    { q: 'What devices can I use Lifeline on?', a: 'Lifeline works on any device with a web browser — phones, tablets, and computers. It is designed mobile-first, so it works well on smaller screens.' },
  ],
  sw: [
    { q: 'Je, mazungumzo yangu ni ya siri kweli?', a: 'Ndiyo. Lifeline haikusanyi jina lako, nambari ya simu, mahali ulipo, au maelezo yoyote yanayokutambulisha. Kila kipindi kinapewa kitambulisho cha nasibu ambacho hakiwezi kukufuatilia.' },
    { q: 'Kiwango cha hatari kinamaanisha nini?', a: 'AI inachambua lugha katika ujumbe wako kukagua usalama wako wa haraka. Kijani (Chini) inamaanisha hakuna hatari inayoonekana. Manjano (Kati) inamaanisha kuna ishara za onyo. Nyekundu (Juu) inamaanisha hatari inayowezekana — mfumo unawasilisha hili kwa mshauri na kuonyesha nambari za dharura mara moja.' },
  ]
}

const EMERGENCY = [
  { label: 'Police Emergency', number: '999', color: '#b85040', bg: '#faeae8' },
  { label: 'GBV National Hotline', number: '1195', color: '#5a8a60', bg: '#eaf2eb' },
  { label: 'Childline Kenya', number: '116', color: '#5a8a60', bg: '#eaf2eb' },
  { label: 'Kituo cha Sheria (Legal Aid)', number: '0800 720 185', color: '#b8843a', bg: '#faf0dc' },
]

function HelpTooltip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 6, cursor: 'pointer' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ color: 'var(--text-3)', display: 'flex' }}><IconInfo /></span>
      {show && (
        <span style={{
          position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--text)', color: 'var(--bg-page)', fontSize: '.75rem',
          padding: '6px 10px', borderRadius: 6, whiteSpace: 'nowrap', zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxWidth: 240, whiteSpace: 'normal',
          lineHeight: 1.45, textAlign: 'center',
        }}>
          {text}
        </span>
      )}
    </span>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-warm)',
      borderRadius: 'var(--r-lg)', overflow: 'hidden',
      transition: 'box-shadow 0.2s',
      boxShadow: open ? 'var(--shadow-md)' : 'var(--shadow-sm)',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '16px 18px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', gap: 12, background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--text)', lineHeight: 1.4 }}>{q}</span>
        <span style={{ flexShrink: 0, color: 'var(--text-3)' }}><IconChevron open={open} /></span>
      </button>
      {open && (
        <div style={{
          padding: '0 18px 16px', color: 'var(--text-2)', fontSize: '.86rem',
          lineHeight: 1.7, borderTop: '1px solid var(--border)',
          paddingTop: 14,
        }}>
          {a}
        </div>
      )}
    </div>
  )
}

export { HelpTooltip }

function Help() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const steps = STEPS[language] || STEPS.en
  const faqs = FAQS[language] || FAQS.en

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', paddingTop: 60, background: 'var(--bg-page)' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '52px 28px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <button className="back-btn" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>← Back</button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginBottom: 10 }}>
            Help &amp; User Guide
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '.97rem', lineHeight: 1.7 }}>
            Everything you need to know about using Lifeline safely and confidently.
          </p>
        </div>

        {/* Quick Emergency Box */}
        <div style={{
          background: '#faeae8', border: '1px solid rgba(184,80,64,.2)',
          borderRadius: 'var(--r-xl)', padding: '20px 22px', marginBottom: 36,
        }}>
          <div style={{ fontWeight: 700, color: '#b85040', marginBottom: 12, fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.8px' }}>
            Emergency Contacts — always available
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {EMERGENCY.map((e) => (
              <a key={e.number} href={`tel:${e.number.replace(/\s/g, '')}`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 'var(--r-md)',
                background: e.bg, border: `1px solid ${e.color}25`,
                color: e.color, textDecoration: 'none', transition: 'all .2s',
              }}>
                <span style={{ fontSize: '.82rem', fontWeight: 600 }}>{e.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '.9rem' }}>{e.number}</span>
              </a>
            ))}
          </div>
        </div>

        {/* How to use — step by step */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, marginBottom: 18 }}>
          How to use Lifeline
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 44 }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: 16, alignItems: 'flex-start',
              background: 'var(--bg-surface)', border: '1px solid var(--border-warm)',
              borderRadius: 'var(--r-lg)', padding: '16px 18px', boxShadow: 'var(--shadow-sm)',
              animation: 'fadeUp .3s ease both', animationDelay: `${i * 0.06}s`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: 'var(--sage-pale)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: 'var(--sage-deep)',
              }}>
                {step.icon}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '.7rem', fontWeight: 700,
                    color: 'var(--sage-deep)', background: 'var(--sage-pale)',
                    border: '1px solid rgba(107,143,113,.2)', borderRadius: 4,
                    padding: '1px 7px', marginRight: 8,
                  }}>Step {i + 1}</span>
                  <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>{step.title}</span>
                </div>
                <p style={{ color: 'var(--text-2)', fontSize: '.83rem', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tooltip Demo Section */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, marginBottom: 10 }}>
          Understanding key features
          <HelpTooltip text="Hover over the info icon next to any feature name throughout the app for a quick explanation." />
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 44 }}>
          {[
            { term: 'Risk Level', def: 'A colour-coded assessment (Low/Medium/High) automatically calculated from the language in your conversation using natural language processing.' },
            { term: 'Quick Exit', def: 'Instantly redirects your browser to Google. Use this if someone approaches while you are using Lifeline. Press Esc on your keyboard for the same effect.' },
            { term: 'Anonymous Session', def: 'Each visit creates a random session ID. No name, email, phone, or device ID is stored. Closing your browser removes all local traces.' },
            { term: 'Resource Matching', def: 'The system recommends support services (hotlines, shelters, legal aid) based on your location and the type of support you need.' },
            { term: 'Threat Detection', def: 'If the AI detects language indicating immediate physical danger, a red alert banner appears with emergency contacts and the counselor is notified.' },
            { term: 'Safety Plan', def: 'A personalised set of 6 actionable steps generated from your risk level — covering immediate safety, documentation, legal options, and support services.' },
          ].map((item) => (
            <div key={item.term} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-warm)',
              borderRadius: 'var(--r-lg)', padding: '14px 16px', boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ fontWeight: 700, fontSize: '.86rem', color: 'var(--sage-deep)', marginBottom: 5 }}>
                {item.term}
                <HelpTooltip text={item.def} />
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: '.8rem', lineHeight: 1.55 }}>{item.def}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, marginBottom: 18 }}>
          Frequently asked questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 44 }}>
          {faqs.map((faq, i) => <FAQItem key={i} {...faq} />)}
        </div>

        {/* Still need help */}
        <div style={{
          background: 'var(--sage-pale)', border: '1px solid rgba(107,143,113,.2)',
          borderRadius: 'var(--r-xl)', padding: '22px 24px', textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>
            Still need help?
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: '.88rem', lineHeight: 1.65, marginBottom: 16 }}>
            If you cannot find the answer here, the GBV National Hotline (1195) has trained counselors available 24/7 who can guide you through using the system or connect you with direct support.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="cta-primary" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => navigate('/chat')}>
              Start a Chat
            </button>
            <button className="cta-secondary" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => navigate('/resources')}>
              View Resources
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Help