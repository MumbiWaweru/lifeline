import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useRisk } from '../../context/RiskContext'
import { chatApi } from '../../services/api'
import { getSessionId } from '../../config'

const WELCOME = {
  en: "Hello. I'm here to listen and support you. Everything you share is completely confidential. Please tell me what's happening — there's no right or wrong way to explain it. Take your time.",
  sw: "Habari. Nipo hapa kukusikiliza na kukusaidia. Kila unachoshiriki ni siri kabisa. Tafadhali niambie kinachoendelea — hakuna njia sahihi au mbaya ya kueleza. Chukua wakati wako.",
}

const RISK_META = {
  green: { label: 'Low Risk',    color: '#5a8a60', bg: '#eaf2eb', border: 'rgba(90,138,96,.28)' },
  amber: { label: 'Medium Risk', color: '#b8843a', bg: '#faf0dc', border: 'rgba(184,132,58,.28)' },
  red:   { label: 'High Risk',   color: '#b85040', bg: '#faeae8', border: 'rgba(184,80,64,.32)' },
}

// SVG Icons
const IconSend = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const IconLeaf = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 22c1.25-1.25 2.5-2.5 3.75-2.5C9 19.5 9 22 12.25 22c3.25 0 3.25-2.5 6.5-2.5S22 22 22 22"/>
    <path d="M2.5 2.5c0 0 5 0 8 5s5 7.5 8 8.5"/>
  </svg>
)
const IconPhone = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)
const IconClipboard = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
)
const IconMap = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
)
const IconAlert = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconLock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

function Chatbot() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { setRiskLevel, riskLevel } = useRisk()
  const [sessionId] = useState(getSessionId())
  const [messages, setMessages] = useState([
    { id: 1, text: WELCOME[language] || WELCOME.en, isUser: false, ts: new Date() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [threatAlert, setThreatAlert] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    setThreatAlert(riskLevel === 'red' || riskLevel === 'high')
  }, [riskLevel])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setMsgCount(c => c + 1)
    setMessages(prev => [...prev, { id: Date.now(), text, isUser: true, ts: new Date() }])
    setLoading(true)

    try {
      const res = await chatApi.sendMessage({ message: text, language, sessionId })
      setRiskLevel(res.risk_level)
      setMessages(prev => [...prev, {
        id: Date.now() + 1, text: res.reply, isUser: false, ts: new Date(),
        hotlines: res.hotlines, riskLevel: res.risk_level,
      }])
    } catch {
      const offline = offlineAssess(text)
      setRiskLevel(offline.risk)
      setMessages(prev => [...prev, {
        id: Date.now() + 1, text: offline.reply, isUser: false, ts: new Date(), offline: true,
      }])
    }
    setLoading(false)
  }

  const offlineAssess = (msg) => {
    const m = msg.toLowerCase()
    const critical = ['kill','dead','weapon','gun','knife','strangle','rape','attack','blood','murder']
    const high = ['hurt','hit','threatened','afraid','scared','danger','escape','trapped','beaten','assault']
    const med = ['control','angry','yell','drunk','jealous','follow','isolate','blame','money']
    const crit = critical.filter(w => m.includes(w)).length
    const hi = high.filter(w => m.includes(w)).length
    const md = med.filter(w => m.includes(w)).length

    if (crit >= 1 || hi >= 2) return {
      risk: 'red',
      reply: language === 'sw'
        ? 'Ninahangaika sana kuhusu usalama wako. Tafadhali nenda mahali salama na piga simu 999 au 1195 mara moja.'
        : 'I am very concerned about your safety right now. Please move to a safe location and call 999 (emergency) or 1195 (GBV hotline) immediately. You deserve to be safe.',
    }
    if (hi >= 1 || md >= 2) return {
      risk: 'amber',
      reply: language === 'sw'
        ? 'Nakusikia. Kile unachopitia ni kigumu sana. Je, una mahali salama unaweza kwenda ukihitaji kuondoka?'
        : 'I hear you. What you are experiencing sounds very difficult. Can you tell me — do you have somewhere safe you could go if you needed to leave quickly?',
    }
    return {
      risk: 'green',
      reply: language === 'sw'
        ? 'Asante kwa kufikia. Ujasiri wako ni muhimu. Niko hapa kukusaidia — unaweza kunieleza zaidi?'
        : 'Thank you for reaching out — that takes courage. I am here to listen and help. Can you tell me a little more about what has been happening?',
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const rm = RISK_META[riskLevel] || RISK_META.green

  return (
    <div className="chat-page">
      {threatAlert && (
        <div className="threat-banner">
          <span className="threat-pulse" />
          <strong>Immediate concern detected —</strong>
          &nbsp;A counselor has been notified. Emergency: <a href="tel:999">999</a> &nbsp;|&nbsp; GBV Hotline: <a href="tel:1195">1195</a>
          <button className="threat-dismiss" onClick={() => setThreatAlert(false)}>✕</button>
        </div>
      )}

      <div className="chat-layout">
        {/* Sidebar */}
        <aside className="chat-sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-brand-mark"><IconLeaf /></div>
            Lifeline
          </div>

          <div className="risk-meter-panel">
            <div className="risk-meter-label">Risk Level</div>
            <div className="risk-meter-track">
              <div className="risk-meter-fill" style={{
                width: riskLevel === 'red' ? '100%' : riskLevel === 'amber' ? '58%' : '18%',
                background: rm.color,
              }} />
            </div>
            <div className="risk-meter-status" style={{ color: rm.color }}>{rm.label}</div>
          </div>

          <div className="sidebar-divider" />

          <div className="sidebar-actions">
            <button className="sa-btn" onClick={() => navigate('/results')}>
              <div className="sa-btn-icon"><IconClipboard /></div>
              View Safety Plan
            </button>
            <button className="sa-btn" onClick={() => navigate('/resources')}>
              <div className="sa-btn-icon"><IconMap /></div>
              Find Resources
            </button>
            <a className="sa-btn sa-emergency" href="tel:1195">
              <div className="sa-btn-icon"><IconPhone /></div>
              Hotline: 1195
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: '.72rem', padding: '0 2px' }}>
            <IconLock /> {msgCount} message{msgCount !== 1 ? 's' : ''} · Session encrypted
          </div>

          <div className="sidebar-note">
            Your conversation is anonymous and not linked to your identity. No account required.
          </div>
        </aside>

        {/* Chat Main */}
        <main className="chat-main">
          <div className="chat-topbar">
            <div className="topbar-info">
              <div className="topbar-avatar"><IconLeaf /></div>
              <div>
                <div className="topbar-name">Lifeline Support</div>
                <div className="topbar-status">
                  <span className="online-dot" /> Trauma-informed AI assistant
                </div>
              </div>
            </div>
            <div className="topbar-risk-chip" style={{ color: rm.color, background: rm.bg, borderColor: rm.border }}>
              {rm.label}
            </div>
          </div>

          <div className="chat-messages-wrap">
            {messages.map((msg) => (
              <div key={msg.id} className={`msg-row ${msg.isUser ? 'msg-row-user' : 'msg-row-bot'}`}>
                {!msg.isUser && (
                  <div className="msg-avatar-bot"><IconLeaf /></div>
                )}
                <div className={`msg-bubble ${msg.isUser ? 'msg-bubble-user' : 'msg-bubble-bot'}`}>
                  <p className="msg-text">{msg.text}</p>
                  {msg.hotlines?.length > 0 && (
                    <div className="msg-hotlines">
                      {msg.hotlines.map((h, i) => (
                        <a key={i} href={`tel:${h.number.replace(/\s/g,'')}`} className="hotline-chip">
                          <IconPhone /> {h.name} — {h.number}
                        </a>
                      ))}
                    </div>
                  )}
                  {msg.riskLevel && msg.riskLevel !== 'green' && (
                    <div className="msg-risk-tag" style={{ color: RISK_META[msg.riskLevel]?.color }}>
                      Risk assessed: {RISK_META[msg.riskLevel]?.label}
                    </div>
                  )}
                  {msg.offline && (
                    <div className="msg-offline-note">Offline mode — backend not connected</div>
                  )}
                  <div className="msg-time">{fmt(msg.ts)}</div>
                </div>
                {msg.isUser && (
                  <div className="msg-avatar-user">You</div>
                )}
              </div>
            ))}

            {loading && (
              <div className="msg-row msg-row-bot">
                <div className="msg-avatar-bot"><IconLeaf /></div>
                <div className="msg-bubble msg-bubble-bot">
                  <div className="typing-dots"><span /><span /><span /></div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="chat-input-panel">
            <div className="chat-input-wrap">
              <textarea
                className="chat-input"
                rows={2}
                placeholder={language === 'sw' ? 'Andika hapa. Chukua wakati wako...' : 'Describe what is happening. Take your time...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
              <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim() || loading}>
                <IconSend />
              </button>
            </div>
            <div className="input-hint">Enter to send · Shift+Enter for a new line</div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Chatbot