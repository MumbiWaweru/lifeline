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

const KEYWORDS = {
  critical: ['kill','dead','weapon','gun','knife','strangle','rape','attack','murder','blood','choke','stab','shoot','burn','poison'],
  high:     ['hurt','hit','beaten','threatened','afraid','scared','danger','trapped','escape','assault','violence','bruise','punch','slap','kick','threw','throw','drag','grabbed','force','forced'],
  medium:   ['control','controlling','angry','yell','yelling','drunk','jealous','follow','isolate','isolated','blame','blaming','money','finances','shout','shouting','humiliate','watch','watching','stop working','not allowed','wont let',"won't let",'forbid','forbidden','track','check phone','lock','locked','hits','argue','fight','fighting'],
  // Distress phrases that only make sense in conversational context
  contextual: [
    'nowhere to go','no where to go','no place to go','nowhere i could go',
    'do not have somewhere','don\'t have somewhere','dont have somewhere',
    'have nowhere','no safe place','cannot leave','can\'t leave','cant leave',
    'no one to call','no one to help','no one will believe','nobody will help',
    'have no money','have no one','have no family','alone here',
    'he will find me','he will hurt','nobody knows','i am alone','i\'m alone',
    'has my phone','took my phone','took my money','took my id',
    'locked in','locked out','wont let me leave',"won't let me leave",
  ],
}

const EMPATHY_EN = {
  'nowhere to go':        "Not having anywhere safe to go is one of the most frightening situations — and I want you to know you're not out of options. Shelters exist for exactly this.",
  'no where to go':       "Not having anywhere safe to go is one of the most frightening feelings — and there ARE people ready to help you find shelter.",
  'do not have somewhere':"Not having a safe place doesn't mean you are without options. Free shelters across Kenya exist specifically to help you right now.",
  "don't have somewhere": "Not having a safe place doesn't mean you are without options. There are trained counselors and shelters ready to help you.",
  'dont have somewhere':  "Not having a safe place doesn't mean you're stuck. Shelters and trained people are ready to help — this is what they do.",
  'have nowhere':         "Feeling like you have nowhere to turn is terrifying, and I'm truly sorry. But options exist — call 1195 now.",
  'cannot leave':         "Feeling unable to leave — being controlled or blocked — is what many survivors experience. It's never your fault. Help exists for exactly this.",
  "can't leave":          "Feeling trapped by someone who controls when/where you go is a recognized form of abuse. You deserve freedom.",
  'cant leave':           "Not being allowed to leave is a serious form of control. You're not alone, and help is available.",
  'no one':               "Feeling completely alone in this is devastating, but you are not alone — thousands of survivors have been where you are.",
  'alone':                "Feeling alone right now makes complete sense — reaching out here took real courage.",
  'scared':               "Being scared in this situation is completely normal — anyone would be. Your fear is valid.",
  'afraid':               "Your fear is real and justified. What you're describing would frighten anyone.",
  'terrified':            "Terror is the right word for what violence causes — and I want you to know your feelings are completely valid.",
  'trapped':              "Feeling trapped is real, and while it feels hopeless, options and escape routes do exist.",
  'control':              "Having someone control your life, your money, who you see — that is a recognized form of abuse. You deserve freedom.",
  'work':                 "Stopping you from working or controlling your income is recognized financial abuse — a trap designed to keep you dependent.",
  'money':                "Controlling your finances is abuse. You have the right to earn, own, and control your own money.",
  'hurt':                 "I'm so deeply sorry you've been hurt. None of this is your fault — what he did is.",
  'hit':                  "Being hit is violence, and violence is never okay, never justified, never your fault.",
  'beats':                "Being beaten is severe violence, and it's never acceptable, never your fault, never something you caused.",
  'abuse':                "Naming it as abuse — that takes clarity and strength. What you're experiencing is real, and so is your right to safety.",
  'been with':            "If you've been in this situation for a long time, that's common — and it makes leaving even harder. Support exists for this.",
  'stay because':         "Whatever reason keeps you — fear of him, kids, money, family pressure — I understand. And there's still help available.",
  'children':             "Wanting to protect your children while also being harmed yourself is an impossible situation. Help exists for families.",
  'kids':                 "Wanting to keep your children safe while you're also in danger — that's a real and hard situation. Shelters support families.",
}

const EMPATHY_SW = {
  'sina mahali':      "Kutokuwa na mahali salama hakumaanishi huna chaguo — kuna makazi na watu waliofunzwa kukusaidia wanawake kama wewe.",
  'popote pa kwenda': "Kutokuwa na mahali salama pa kwenda ni hali ngumu sana, lakini kuna msaada — piga 1195 sasa.",
  'peke yangu':       "Kuhisi peke yako ni jambo gumu sana — lakini si kweli. Wanawake wengi wanakabili hii, na msaada upo.",
  'siwezi kutoka':    "Kuhisi huwezi kutoka — kwa sababu anataka kudhibiti au kwa sababu ya watoto — hii ni hali inayoeleweka. Msaada upo.",
  'anataka':          "Kujaribu kuagiza au kudhibiti unacholote — saa ya wazimu, ni nini kinachoweza kusema — ni aina ya unyanyasaji.",
  'control':          "Mtu kujaribu kudhibiti maisha yako, fedha, wajibu — hii ni unyanyasaji ambao unastahili kutokuwa nacho.",
  'akili':            "Kujaribu kumkamatia akili yako, kumkumbusha kila kigumu — hii ni tiktiki ya maajabu inayotekeleza udanganyifu.",
  'scared':           "Ni kawaida kabisa kuhisi woga wakati kama hii — wewe si wazimu, hii ni woga wa kupokea.",
  'money':            "Kudhibiti fedha zako au kumkubali kupokea pesa tu — hii ni huduma ya kukulock kwenye uhaba.",
  'mmoja':            "Kuhisi kuwa mmoja ndani ya nyumba hii ni kawaida sana kwa wanawake walionaumiza.",
  'baba wa':          "Kujisifu kama mzazi katika nyumba hiyo lakini akikuumiza — hii ni hali ngumu kwa watoto na wewe."
}

function getEmpathyOpener(message, history, language) {
  const recentUserMsgs = history.filter(m => m.isUser).slice(-3).map(m => m.text).join(' ')
  const combined = (recentUserMsgs + ' ' + message).toLowerCase()
  const openers = language === 'sw' ? EMPATHY_SW : EMPATHY_EN
  const sorted = Object.entries(openers).sort((a, b) => b[0].length - a[0].length)
  for (const [kw, opener] of sorted) {
    if (combined.includes(kw)) return opener
  }
  return language === 'sw' ? "Nakusikia wewe, na ninajali." : "I hear you, and I care about your safety."
}

function scoreRisk(message, history, currentRisk) {
  const recentUserMsgs = history.filter(m => m.isUser).slice(-4).map(m => m.text).join(' ')
  const combined = (recentUserMsgs + ' ' + message).toLowerCase()

  const crit = KEYWORDS.critical.filter(w => combined.includes(w)).length
  const high = KEYWORDS.high.filter(w => combined.includes(w)).length
  const med  = KEYWORDS.medium.filter(w => combined.includes(w)).length
  const ctx  = KEYWORDS.contextual.filter(w => combined.includes(w)).length

  if (crit >= 1 || high >= 2) return 'red'
  if (high >= 1 || med >= 1 || ctx >= 1) return 'amber'
  // Never silently de-escalate mid-conversation — hold amber if already established
  if (currentRisk === 'amber') return 'amber'
  return 'green'
}

function buildNowhereReply(language, name) {
  const greet = name?.trim() ? `${name.trim()}, ` : ''
  if (language === 'sw') {
    return `${greet}asante kwa kuniambia hilo — najua si rahisi kusema. Kutokuwa na mahali pa kwenda au kuishi ni hali ngumu kabisa. LAKINI — hii si mwisho wa njia. Kenya ina makazi ya GBV yanayopokea wanawake kama wewe bila malipo, siri, na bila hati yoyote. GVRC (piga 1195) inajua mahali YOTE. Watakuuliza jina lako tu na kaunti unako, na kisha watakuambatanisha na makazi karibu nawe. 1195 inafanya kazi saa yote — siri na ya bure. Je, unakumbuka karibu jina la kaunti au mji unako?`
  }
  return `${greet}thank you for trusting me with that — I know it takes courage. Not having a safe place to go is one of the most terrifying feelings. But here's what I want you to know: you are NOT out of options. Right now, across Kenya, there are GBV shelters ready to take you in. Free. Confidential. No documents needed. Many have childcare, counseling, and help with next steps. When you call 1195 (GVRC), tell them you need shelter. They know where to place you based on your location. They do this every single day. Can you tell me roughly which county or area you're in? That'll help me point you to the right resources.`
}

function buildOfflineReply(message, history, language, name, currentRisk) {
  const msgLower = message.toLowerCase()
  const risk     = scoreRisk(message, history, currentRisk)
  const empathy  = getEmpathyOpener(message, history, language)
  const greet    = name?.trim() ? `${name.trim()}, ` : ''

  const nowherePhrases = [
    'nowhere to go','no where to go','no place to go','nowhere i could go',
    'do not have somewhere',"don't have somewhere",'dont have somewhere','have nowhere',
  ]
  if (nowherePhrases.some(p => msgLower.includes(p))) {
    return {
      risk: 'amber',
      reply: buildNowhereReply(language, name),
      hotlines: [
        { name: 'GVRC Hotline (24hr)',          number: '1195',         type: 'hotline' },
        { name: 'Kituo cha Sheria (Legal Aid)', number: '0800 720 185', type: 'legal'   },
        { name: 'Wangu Kanja Foundation',       number: '0711 200 400', type: 'shelter' },
      ],
    }
  }

  if (language === 'sw') {
    const emp = empathy || 'Nakusikia, na ninajali hali yako sana.'
    if (risk === 'red') return {
      risk,
      reply: `${emp} ${greet}kile unachokielezea ni hatari sana na SI kosa lako — ukweli mtupu. Usalama wako ndio muhimu zaidi SASA. Ikiwa unaweza, nenda mahali penye watu wengine. Piga simu 999 (polisi) au 1195 (GVRC) mara moja. Unaweza kusikia simu? Je, uko mahali salama sasa hivi?`,
      hotlines: [
        { name: 'Polisi wa Kenya (999 — Emergency)', number: '999',         type: 'emergency' },
        { name: 'GVRC Hotline (1195 — 24hr)',    number: '1195',        type: 'hotline'   },
        { name: 'Wangu Kanja Shelter',     number: '0711 200 400',type: 'shelter'   },
      ],
    }
    if (risk === 'amber') return {
      risk,
      reply: `${emp} ${greet}unastahili kuishi bila woga, bila kuzuiwa, bila kutofautiana. Hii SI kawaida, hata kama imekuwa nchi kwa muda mrefu. Wewe si mwenyewe — wanaume wengi wanakabili hii. Unaweza piga simu 1195 saa yoyote (bure, siri) kuzungumza na kundi linajua jinsi ya kusaidia. Nani anayejali kwa ajili yako?`,
      hotlines: [
        { name: 'GVRC Hotline (1195 — Msaada wa siri)',     number: '1195',         type: 'hotline' },
        { name: 'Kituo cha Sheria (Msaada wa kisheria)', number: '0800 720 185', type: 'legal'   },
      ],
    }
    return {
      risk,
      reply: `${emp} ${greet}ujasuri wako wa kusikia ni muhimu. Niko hapa kukusikiliza bila kuhukumu kabisa. Unaweza kusema kile unachohisi — kila kitu ni siri na salama. Ni nini kinachofanya uwe na wasiwasi zaidi sasa hivi?`,
      hotlines: [{ name: 'GVRC Hotline', number: '1195', type: 'hotline' }],
    }
  }

  const emp = empathy || "I hear you, and I genuinely care about what you're going through."
  if (risk === 'red') return {
    risk,
    reply: `${emp} ${greet}what you just described is serious, and I want you to know: it's not your fault. Not in any way. Your safety right now is everything. If you can, go somewhere with other people. Call 999 for police or 1195 (GVRC) right now — they're trained to help. Can you reach a phone? Are you somewhere safe right now?`,
    hotlines: [
      { name: 'Police Emergency (999)', number: '999',         type: 'emergency'    },
      { name: 'GVRC Hotline (1195 — 24/7)',  number: '1195',        type: 'hotline'      },
      { name: 'Wangu Kanja Foundation', number: '0711 200 400',type: 'organization' },
    ],
  }
  if (risk === 'amber') return {
    risk,
    reply: `${emp} ${greet}you deserve safety, respect, and freedom from fear or control. What's happening is not normal, even if it's been going on for a while. You're not alone — many people face this. 1195 (GVRC) is free, confidential, and available 24/7. They've helped thousands. Do you have someone you trust — a friend, family member, or counselor — you could talk to?`,
    hotlines: [
      { name: 'GVRC National Hotline (1195)',        number: '1195',         type: 'hotline' },
      { name: 'Kituo cha Sheria (Legal Aid)', number: '0800 720 185', type: 'legal'   },
    ],
  }
  return {
    risk,
    reply: `${emp} ${greet}your courage in reaching out matters so much. I'm here to listen — truly listen — without judgment or advice you didn't ask for. What's been the hardest part of what you're experiencing?`,
    hotlines: [{ name: 'GVRC National Hotline', number: '1195', type: 'hotline' }],
  }
}

// SVG Icons
const IconSend      = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
const IconLeaf      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22c1.25-1.25 2.5-2.5 3.75-2.5C9 19.5 9 22 12.25 22c3.25 0 3.25-2.5 6.5-2.5S22 22 22 22"/><path d="M2.5 2.5c0 0 5 0 8 5s5 7.5 8 8.5"/></svg>
const IconPhone     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
const IconClipboard = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
const IconMap       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
const IconLock      = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>

function Chatbot() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { setRiskLevel, riskLevel } = useRisk()
  const [sessionId]  = useState(getSessionId())
  const [messages, setMessages] = useState([
    { id: 1, text: WELCOME[language] || WELCOME.en, isUser: false, ts: new Date() }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [threatAlert, setThreatAlert] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])
  useEffect(() => { setThreatAlert(riskLevel === 'red' || riskLevel === 'high') }, [riskLevel])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setMsgCount(c => c + 1)
    const historySnapshot = [...messages]   // capture before state update
    setMessages(prev => [...prev, { id: Date.now(), text, isUser: true, ts: new Date() }])
    setLoading(true)

    try {
      const res = await chatApi.sendMessage({ message: text, language, sessionId })
      setRiskLevel(res.risk_level)
      setMessages(prev => [...prev, {
        id: Date.now() + 1, text: res.reply, isUser: false, ts: new Date(),
        hotlines: res.hotlines, riskLevel: res.risk_level,
      }])
    } catch (err) {
      console.warn('Backend unavailable, using offline mode:', err.message)
      const offline = buildOfflineReply(text, historySnapshot, language, '', riskLevel)
      setRiskLevel(offline.risk)
      setMessages(prev => [...prev, {
        id: Date.now() + 1, text: offline.reply, isUser: false, ts: new Date(),
        hotlines: offline.hotlines, riskLevel: offline.risk, offline: true,
      }])
    }
    setLoading(false)
  }

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }
  const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const rm  = RISK_META[riskLevel] || RISK_META.green

  return (
    <div className="chat-page">
      {threatAlert && (
        <div className="threat-banner">
          <span className="threat-pulse" />
          <strong>Immediate concern detected —</strong>
          &nbsp;Emergency: <a href="tel:999">999</a> &nbsp;|&nbsp; GBV Hotline: <a href="tel:1195">1195</a>
          <button className="threat-dismiss" onClick={() => setThreatAlert(false)}>✕</button>
        </div>
      )}

      <div className="chat-layout">
        <aside className="chat-sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-brand-mark"><IconLeaf /></div>
            Lifeline
          </div>
          <div className="risk-meter-panel">
            <div className="risk-meter-label">Risk Level</div>
            <div className="risk-meter-track">
              <div className="risk-meter-fill" style={{ width: riskLevel === 'red' ? '100%' : riskLevel === 'amber' ? '58%' : '18%', background: rm.color }} />
            </div>
            <div className="risk-meter-status" style={{ color: rm.color }}>{rm.label}</div>
          </div>
          <div className="sidebar-divider" />
          <div className="sidebar-actions">
            <button className="sa-btn" onClick={() => navigate('/results')}>
              <div className="sa-btn-icon"><IconClipboard /></div>View Safety Plan
            </button>
            <button className="sa-btn" onClick={() => navigate('/resources')}>
              <div className="sa-btn-icon"><IconMap /></div>Find Resources
            </button>
            <a className="sa-btn sa-emergency" href="tel:1195">
              <div className="sa-btn-icon"><IconPhone /></div>Hotline: 1195
            </a>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-3)', fontSize:'.72rem', padding:'0 2px' }}>
            <IconLock /> {msgCount} message{msgCount !== 1 ? 's' : ''} · Session encrypted
          </div>
          <div className="sidebar-note">Your conversation is anonymous and not linked to your identity.</div>
        </aside>

        <main className="chat-main">
          <div className="chat-topbar">
            <div className="topbar-info">
              <div className="topbar-avatar"><IconLeaf /></div>
              <div>
                <div className="topbar-name">Lifeline Support</div>
                <div className="topbar-status"><span className="online-dot" /> Trauma-informed AI assistant</div>
              </div>
            </div>
            <div className="topbar-risk-chip" style={{ color:rm.color, background:rm.bg, borderColor:rm.border }}>{rm.label}</div>
          </div>

          <div className="chat-messages-wrap">
            {messages.map((msg) => (
              <div key={msg.id} className={`msg-row ${msg.isUser ? 'msg-row-user' : 'msg-row-bot'}`}>
                {!msg.isUser && <div className="msg-avatar-bot"><IconLeaf /></div>}
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
                  {msg.offline && <div className="msg-offline-note">Offline mode — connect backend for full AI responses</div>}
                  <div className="msg-time">{fmt(msg.ts)}</div>
                </div>
                {msg.isUser && <div className="msg-avatar-user">You</div>}
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