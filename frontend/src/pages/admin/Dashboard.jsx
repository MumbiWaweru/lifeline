import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/api'
import { STORAGE_KEYS } from '../../config'

const IconGrid    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
const IconMsg     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
const IconClip    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
const IconFlask   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6m-6 0v6l-4.7 8.3A2 2 0 0 0 6 21h12a2 2 0 0 0 1.7-2.7L15 9V3"/><line x1="6.2" y1="16" x2="17.8" y2="16"/></svg>
const IconDB      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
const IconChart   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const IconLeaf    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22c1.25-1.25 2.5-2.5 3.75-2.5C9 19.5 9 22 12.25 22c3.25 0 3.25-2.5 6.5-2.5S22 22 22 22"/><path d="M2.5 2.5c0 0 5 0 8 5s5 7.5 8 8.5"/></svg>
const IconRefresh = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>

const RISK_STYLE = {
  red:   { color: '#b85040', bg: '#faeae8', border: 'rgba(184,80,64,.25)', label: 'HIGH RISK', dot: '#b85040' },
  amber: { color: '#b8843a', bg: '#faf0dc', border: 'rgba(184,132,58,.25)', label: 'MEDIUM',    dot: '#b8843a' },
  green: { color: '#5a8a60', bg: '#eaf2eb', border: 'rgba(90,138,96,.25)', label: 'LOW',        dot: '#5a8a60' },
}
const DEMO = [
  { session_id: 'abc123xyz', risk_level: 'red',   language: 'en', timestamp: new Date().toISOString(), messages: [{ sender: 'user', content: 'He threatened to hurt me if I try to leave.', timestamp: new Date().toISOString() }] },
  { session_id: 'def456uvw', risk_level: 'amber', language: 'sw', timestamp: new Date(Date.now()-3600000).toISOString(), messages: [{ sender: 'user', content: 'Ananikemea kila siku na kudhibiti pesa zangu.', timestamp: new Date().toISOString() }] },
  { session_id: 'ghi789rst', risk_level: 'green', language: 'en', timestamp: new Date(Date.now()-7200000).toISOString(), messages: [{ sender: 'user', content: 'I just need someone to talk to about my relationship.', timestamp: new Date().toISOString() }] },
]

function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, green: 0, amber: 0, red: 0 })
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [riskFilter, setRiskFilter] = useState('all')
  const [error, setError] = useState(null)
  const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || localStorage.getItem('adminAuth')

  useEffect(() => { if (!token) { navigate('/admin/login'); return } loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([adminApi.getStats(token), adminApi.getConversations(token)])
      setStats(s); setConversations(c.conversations || []); setError(null)
    } catch {
      setStats({ total: 47, green: 28, amber: 13, red: 6 })
      setConversations(DEMO)
      setError('Live API unavailable — showing demo data')
    }
    setLoading(false)
  }

  const logout = () => { localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN); localStorage.removeItem('adminAuth'); navigate('/admin/login') }
  const pct = (k) => stats.total ? Math.round((stats[k] / stats.total) * 100) : 0
  const filtered = riskFilter === 'all' ? conversations : conversations.filter(c => c.risk_level === riskFilter)

  const NAV_ITEMS = [
    { label: 'Dashboard',     Icon: IconGrid,  path: '/admin/dashboard',  active: true  },
    { label: 'Conversations', Icon: IconMsg,   path: '/admin/conversations' },
    { label: 'Resources',     Icon: IconClip,  path: '/admin/resources'   },
    { label: 'Reports',       Icon: IconChart, path: '/admin/reports'     },
    { label: 'Testing',       Icon: IconFlask, path: '/admin/testing'     },
    { label: 'Database',      Icon: IconDB,    path: '/admin/database'    },
  ]

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo"><IconLeaf /></div>
          <span>Lifeline Admin</span>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map(({ label, Icon, path, active }) => (
            <button key={label} className={`admin-nav-item ${active ? 'active' : ''}`} onClick={() => navigate(path)}>
              <div className="admin-nav-icon"><Icon /></div>
              {label}
            </button>
          ))}
        </nav>

        <div className="admin-nav-bottom">
          <div className="admin-user-info">
            <div className="admin-avatar">A</div>
            <div><div className="admin-uname">Administrator</div><div className="admin-urole">Lifeline System</div></div>
          </div>
          <button className="admin-logout-btn" onClick={logout}>Sign Out</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-sub">{new Date().toLocaleDateString('en-KE', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
          </div>
          <button className="admin-refresh-btn" onClick={loadData} style={{ display:'flex', alignItems:'center', gap:7 }}>
            <IconRefresh /> Refresh
          </button>
        </div>

        {error && <div className="admin-warning">{error}</div>}

        {loading ? (
          <div className="admin-loading"><div className="loading-spinner" /><p>Loading data...</p></div>
        ) : (
          <>
            <div className="admin-stats-grid">
              {[
                { label:'Total Conversations', value:stats.total, color:'#6b5fb0', iconBg:'rgba(107,95,176,.1)' },
                { label:'High Risk Cases',     value:stats.red,   color:'#b85040', iconBg:'#faeae8' },
                { label:'Medium Risk',         value:stats.amber, color:'#b8843a', iconBg:'#faf0dc' },
                { label:'Low Risk',            value:stats.green, color:'#5a8a60', iconBg:'#eaf2eb' },
              ].map(s => (
                <div key={s.label} className="admin-stat-card">
                  <div className="asc-icon" style={{ background:s.iconBg, color:s.color }}><IconGrid /></div>
                  <div className="asc-value" style={{ color:s.color }}>{s.value}</div>
                  <div className="asc-label">{s.label}</div>
                  <div className="asc-sub">{s.label === 'Total Conversations' ? 'All time' : `${pct(s.label.includes('High') ? 'red' : s.label.includes('Medium') ? 'amber' : 'green')}% of total`}</div>
                </div>
              ))}
            </div>

            <div className="admin-risk-dist">
              <div className="ard-label">Risk Distribution</div>
              <div className="ard-bar">
                <div className="ard-seg" style={{ width:`${pct('green')}%`, background:'#5a8a60' }} />
                <div className="ard-seg" style={{ width:`${pct('amber')}%`, background:'#b8843a' }} />
                <div className="ard-seg" style={{ width:`${pct('red')}%`, background:'#b85040' }} />
              </div>
              <div className="ard-legend">
                {[['#5a8a60',`Low ${pct('green')}%`],['#b8843a',`Medium ${pct('amber')}%`],['#b85040',`High ${pct('red')}%`]].map(([c,l])=>(
                  <span key={l}><span style={{background:c}} />{l}</span>
                ))}
              </div>
            </div>

            {/* Quick-access cards to new pages */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
              {[
                { label:'View Reports', sub:'Print or export CSV', icon:<IconChart />, path:'/admin/reports', color:'#6b5fb0', bg:'#f0eefa' },
                { label:'Run Tests', sub:'Validate system accuracy', icon:<IconFlask />, path:'/admin/testing', color:'#5a8a60', bg:'#eaf2eb' },
                { label:'Database Design', sub:'ER diagram & schema', icon:<IconDB />, path:'/admin/database', color:'#b8843a', bg:'#faf0dc' },
              ].map(card => (
                <button key={card.label} onClick={() => navigate(card.path)} style={{
                  display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
                  background:card.bg, border:`1px solid ${card.color}25`, borderRadius:'var(--r-lg)',
                  cursor:'pointer', textAlign:'left', transition:'all .2s',
                }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:card.color, display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0 }}>{card.icon}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'.85rem', color:card.color }}>{card.label}</div>
                    <div style={{ fontSize:'.74rem', color:'var(--text-2)' }}>{card.sub}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="admin-section">
              <div className="admin-section-header">
                <h2>Recent Conversations</h2>
                <div className="admin-filter-btns">
                  {[['all','All'],['red','High'],['amber','Medium'],['green','Low']].map(([v,l])=>(
                    <button key={v} className={`admin-filter-btn ${riskFilter===v?'active':''}`} onClick={()=>setRiskFilter(v)}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="admin-conv-list">
                {filtered.length === 0 ? (
                  <div className="admin-empty">No conversations match this filter.</div>
                ) : filtered.map((conv, i) => {
                  const rs = RISK_STYLE[conv.risk_level] || RISK_STYLE.green
                  const preview = conv.messages?.find(m => m.sender==='user')?.content || 'No messages'
                  return (
                    <div key={i} className="admin-conv-row" onClick={()=>setSelected(conv)}>
                      <div className="acr-risk-dot" style={{ background:rs.dot }} />
                      <div className="acr-content">
                        <div className="acr-top">
                          <span className="acr-id">#{conv.session_id?.slice(-6)||i+1}</span>
                          <span className="acr-risk-badge" style={{ color:rs.color, background:rs.bg, borderColor:rs.border }}>{rs.label}</span>
                          <span className="acr-lang">{conv.language?.toUpperCase()}</span>
                        </div>
                        <div className="acr-preview">{preview.slice(0,110)}{preview.length>110?'...':''}</div>
                        <div className="acr-time">{new Date(conv.timestamp).toLocaleString('en-KE')}</div>
                      </div>
                      <div className="acr-arrow">→</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </main>

      {selected && (
        <div className="admin-modal-overlay" onClick={()=>setSelected(null)}>
          <div className="admin-modal" onClick={e=>e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Conversation Detail</h3>
                {(() => { const rs=RISK_STYLE[selected.risk_level]||RISK_STYLE.green; return (
                  <span className="acr-risk-badge" style={{ color:rs.color, background:rs.bg, borderColor:rs.border }}>{rs.label}</span>
                )})()}
              </div>
              <button className="modal-close" onClick={()=>setSelected(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              {(selected.messages||[]).map((m,i)=>(
                <div key={i} className={`modal-msg ${m.sender==='user'?'modal-msg-user':'modal-msg-bot'}`}>
                  <div className="modal-msg-sender">{m.sender==='user'?'Survivor':'AI Support'}</div>
                  <div className="modal-msg-text">{m.content}</div>
                  <div className="modal-msg-time">{new Date(m.timestamp).toLocaleTimeString('en-KE')}</div>
                </div>
              ))}
            </div>
            <div className="admin-modal-footer">
              <span className="modal-anon-note">All identifying information is anonymized</span>
              <button className="modal-export-btn" onClick={()=>{
                const text=(selected.messages||[]).map(m=>`[${m.sender}]: ${m.content}`).join('\n')
                const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'text/plain'})); a.download=`case-${selected.session_id}.txt`; a.click()
              }}>Export Case</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard