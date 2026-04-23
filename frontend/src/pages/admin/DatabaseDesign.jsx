import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { healthApi } from '../../services/api'
import { API_BASE_URL } from '../../config'

// Fix import

const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IconX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconDB = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
const IconLink = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
const IconExternal = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>

const TABLES = [
  {
    name: 'conversations',
    color: '#5a8a60', bg: '#eaf2eb', border: 'rgba(90,138,96,.25)',
    desc: 'Stores each anonymous chat session. One row per user visit.',
    fields: [
      { name: 'id', type: 'UUID', pk: true, desc: 'Primary key — randomly generated, not sequential' },
      { name: 'session_id', type: 'VARCHAR(64)', unique: true, desc: 'Client-generated random session identifier' },
      { name: 'language', type: 'VARCHAR(4)', desc: "User's language: 'en' or 'sw'" },
      { name: 'risk_level', type: 'VARCHAR(10)', desc: "Latest risk: 'green', 'amber', or 'red'" },
      { name: 'created_at', type: 'TIMESTAMP', desc: 'When the conversation started (UTC)' },
    ]
  },
  {
    name: 'messages',
    color: '#3b7fc4', bg: '#e8f0fa', border: 'rgba(59,127,196,.25)',
    desc: 'Individual messages within a conversation. Each chat bubble = one row.',
    fields: [
      { name: 'id', type: 'UUID', pk: true, desc: 'Primary key' },
      { name: 'conversation_id', type: 'UUID', fk: 'conversations.id', desc: 'Foreign key — links message to its conversation' },
      { name: 'sender', type: 'VARCHAR(16)', desc: "'user' or 'assistant'" },
      { name: 'content', type: 'TEXT', desc: 'The message text (plain text, no HTML)' },
      { name: 'created_at', type: 'TIMESTAMP', desc: 'When the message was sent (UTC)' },
    ]
  },
  {
    name: 'resources',
    color: '#b8843a', bg: '#faf0dc', border: 'rgba(184,132,58,.25)',
    desc: 'Support organisation directory. Editable via the admin Resource Manager.',
    fields: [
      { name: 'id', type: 'UUID', pk: true, desc: 'Primary key' },
      { name: 'name', type: 'VARCHAR(255)', desc: 'Organisation or service name' },
      { name: 'number', type: 'VARCHAR(64)', desc: 'Phone number or hotline' },
      { name: 'type', type: 'VARCHAR(64)', desc: "'hotline', 'shelter', 'legal', 'medical', 'police'" },
      { name: 'location', type: 'VARCHAR(128)', desc: 'County or city — used for location filtering' },
      { name: 'language', type: 'VARCHAR(4)', desc: "Primary language: 'en' or 'sw'" },
      { name: 'created_at', type: 'TIMESTAMP', desc: 'When the record was added' },
    ]
  }
]

function DatabaseDesign() {
  const navigate = useNavigate()
  const [dbStatus, setDbStatus] = useState(null)
  const [checking, setChecking] = useState(false)

  const checkConnection = async () => {
    setChecking(true)
    try {
      const res = await healthApi.check()
      setDbStatus({ ok: true, env: res.environment, msg: 'Database connected successfully' })
    } catch {
      setDbStatus({ ok: false, msg: 'Backend not running. Start with: uvicorn app.main:app --reload' })
    }
    setChecking(false)
  }

  useEffect(() => { checkConnection() }, [])

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', paddingTop: 60, background: 'var(--bg-page)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 28px' }}>

        <div style={{ marginBottom: 32 }}>
          <button className="back-btn" onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: 18 }}>← Back to Dashboard</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 700, marginBottom: 6 }}>Database Design</h1>
              <p style={{ color: 'var(--text-2)', fontSize: '.9rem' }}>
                Entity-relationship diagram, schema documentation, and live connection status.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={checkConnection}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 'var(--r-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-md)', color: 'var(--text-2)', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {checking ? '...' : 'Test Connection'}
              </button>
              <a
                href={`${API_BASE_URL}/docs`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 'var(--r-md)', background: 'var(--sage)', color: 'var(--text-inv)', fontSize: '.82rem', fontWeight: 700, border: 'none', cursor: 'pointer', textDecoration: 'none' }}
              >
                <IconExternal /> View API Docs
              </a>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {dbStatus && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px', borderRadius: 'var(--r-lg)', marginBottom: 28,
            background: dbStatus.ok ? '#eaf2eb' : '#faeae8',
            border: `1px solid ${dbStatus.ok ? 'rgba(90,138,96,.25)' : 'rgba(184,80,64,.25)'}`,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: dbStatus.ok ? '#5a8a60' : '#b85040', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
              {dbStatus.ok ? <IconCheck /> : <IconX />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.88rem', color: dbStatus.ok ? '#5a8a60' : '#b85040' }}>
                {dbStatus.ok ? 'Database connected' : 'Database offline'}
              </div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-2)' }}>{dbStatus.msg}</div>
            </div>
            {dbStatus.ok && (
              <div style={{ marginLeft: 'auto', fontSize: '.78rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                env: {dbStatus.env}
              </div>
            )}
          </div>
        )}

        {/* ER Diagram — visual SVG */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 14 }}>
          Entity-Relationship Diagram
        </h2>
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-warm)',
          borderRadius: 'var(--r-xl)', padding: '28px', marginBottom: 32,
          boxShadow: 'var(--shadow-sm)', overflowX: 'auto',
        }}>
          <svg viewBox="0 0 820 340" style={{ width: '100%', maxWidth: 820, display: 'block', margin: '0 auto', minWidth: 560 }}>
            {/* Conversations table */}
            <rect x="30" y="30" width="220" height="190" rx="10" fill="#eaf2eb" stroke="rgba(90,138,96,.35)" strokeWidth="1.5"/>
            <rect x="30" y="30" width="220" height="38" rx="10" fill="#5a8a60"/>
            <rect x="30" y="54" width="220" height="14" fill="#5a8a60"/>
            <text x="140" y="53" textAnchor="middle" fill="white" fontSize="13" fontWeight="600" fontFamily="Lora, serif">conversations</text>
            {[
              { y: 94,  text: 'id : UUID (PK)', bold: true },
              { y: 114, text: 'session_id : VARCHAR' },
              { y: 134, text: 'language : VARCHAR(4)' },
              { y: 154, text: 'risk_level : VARCHAR(10)' },
              { y: 174, text: 'created_at : TIMESTAMP' },
              { y: 198, text: '1 conversation → many messages', italic: true, small: true },
            ].map((r, i) => (
              <text key={i} x="48" y={r.y} fill={r.bold ? '#2d6b35' : '#4a6b50'} fontSize={r.small ? 10 : 11} fontWeight={r.bold ? '700' : '400'} fontStyle={r.italic ? 'italic' : 'normal'} fontFamily="Inconsolata, monospace">{r.text}</text>
            ))}

            {/* Messages table */}
            <rect x="300" y="30" width="220" height="190" rx="10" fill="#e8f0fa" stroke="rgba(59,127,196,.35)" strokeWidth="1.5"/>
            <rect x="300" y="30" width="220" height="38" rx="10" fill="#3b7fc4"/>
            <rect x="300" y="54" width="220" height="14" fill="#3b7fc4"/>
            <text x="410" y="53" textAnchor="middle" fill="white" fontSize="13" fontWeight="600" fontFamily="Lora, serif">messages</text>
            {[
              { y: 94,  text: 'id : UUID (PK)', bold: true },
              { y: 114, text: 'conversation_id : UUID (FK)', fk: true },
              { y: 134, text: 'sender : VARCHAR(16)' },
              { y: 154, text: 'content : TEXT' },
              { y: 174, text: 'created_at : TIMESTAMP' },
              { y: 198, text: 'FK → conversations.id', italic: true, small: true },
            ].map((r, i) => (
              <text key={i} x="316" y={r.y} fill={r.fk ? '#185fa5' : r.bold ? '#185fa5' : '#1a4b8a'} fontSize={r.small ? 10 : 11} fontWeight={r.bold || r.fk ? '700' : '400'} fontStyle={r.italic ? 'italic' : 'normal'} fontFamily="Inconsolata, monospace">{r.text}</text>
            ))}

            {/* Resources table */}
            <rect x="570" y="30" width="220" height="220" rx="10" fill="#faf0dc" stroke="rgba(184,132,58,.35)" strokeWidth="1.5"/>
            <rect x="570" y="30" width="220" height="38" rx="10" fill="#b8843a"/>
            <rect x="570" y="54" width="220" height="14" fill="#b8843a"/>
            <text x="680" y="53" textAnchor="middle" fill="white" fontSize="13" fontWeight="600" fontFamily="Lora, serif">resources</text>
            {[
              { y: 94,  text: 'id : UUID (PK)', bold: true },
              { y: 114, text: 'name : VARCHAR(255)' },
              { y: 134, text: 'number : VARCHAR(64)' },
              { y: 154, text: 'type : VARCHAR(64)' },
              { y: 174, text: 'location : VARCHAR(128)' },
              { y: 194, text: 'language : VARCHAR(4)' },
              { y: 214, text: 'created_at : TIMESTAMP' },
              { y: 234, text: 'Independent — no FK', italic: true, small: true },
            ].map((r, i) => (
              <text key={i} x="586" y={r.y} fill={r.bold ? '#7a5012' : '#8f6e2a'} fontSize={r.small ? 10 : 11} fontWeight={r.bold ? '700' : '400'} fontStyle={r.italic ? 'italic' : 'normal'} fontFamily="Inconsolata, monospace">{r.text}</text>
            ))}

            {/* Relationship line: conversations → messages */}
            <line x1="250" y1="125" x2="300" y2="125" stroke="#5a8a60" strokeWidth="2" strokeDasharray="5,3"/>
            {/* Cardinality labels */}
            <text x="255" y="120" fill="#5a8a60" fontSize="11" fontFamily="Lora, serif" fontWeight="600">1</text>
            <text x="276" y="120" fill="#3b7fc4" fontSize="11" fontFamily="Lora, serif" fontWeight="600">N</text>

            {/* Legend */}
            <rect x="30" y="270" width="760" height="55" rx="8" fill="var(--bg-raised, #f0ede8)" stroke="rgba(160,140,120,.18)" strokeWidth="1"/>
            <text x="50" y="290" fill="#6b5c50" fontSize="10" fontFamily="Inconsolata, monospace" fontWeight="700">LEGEND:</text>
            <rect x="110" y="280" width="10" height="10" rx="2" fill="#5a8a60"/>
            <text x="126" y="290" fill="#6b5c50" fontSize="10" fontFamily="Inconsolata, monospace">PK = Primary Key (UUID)</text>
            <rect x="280" y="280" width="10" height="10" rx="2" fill="#3b7fc4"/>
            <text x="296" y="290" fill="#6b5c50" fontSize="10" fontFamily="Inconsolata, monospace">FK = Foreign Key</text>
            <line x1="430" y1="285" x2="460" y2="285" stroke="#5a8a60" strokeWidth="2" strokeDasharray="5,3"/>
            <text x="468" y="290" fill="#6b5c50" fontSize="10" fontFamily="Inconsolata, monospace">One-to-Many relationship</text>
            <text x="50" y="312" fill="#6b5c50" fontSize="10" fontFamily="Inconsolata, monospace">Database: SQLite (development) / PostgreSQL (production) · ORM: SQLAlchemy 2.0 async · All IDs are UUIDs (non-sequential for privacy)</text>
          </svg>
        </div>

        {/* Table schema detail */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 14 }}>
          Table Schemas
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          {TABLES.map(table => (
            <div key={table.name} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-warm)',
              borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ padding: '14px 18px', background: table.bg, borderBottom: `1px solid ${table.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: table.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  <IconDB />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '.9rem', color: table.color }}>{table.name}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-2)' }}>{table.desc}</div>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-raised)' }}>
                      {['Column', 'Type', 'Constraints', 'Description'].map(h => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-3)', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.7px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.fields.map((f, i) => (
                      <tr key={f.name} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--bg-raised)' }}>
                        <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontWeight: f.pk || f.fk ? 700 : 400, color: f.pk ? table.color : f.fk ? '#3b7fc4' : 'var(--text)' }}>
                          {f.name}
                        </td>
                        <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontSize: '.78rem' }}>{f.type}</td>
                        <td style={{ padding: '9px 14px' }}>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {f.pk && <span style={{ fontSize: '.68rem', padding: '1px 7px', borderRadius: 4, background: table.bg, color: table.color, border: `1px solid ${table.border}`, fontWeight: 700 }}>PRIMARY KEY</span>}
                            {f.fk && <span style={{ fontSize: '.68rem', padding: '1px 7px', borderRadius: 4, background: '#e8f0fa', color: '#3b7fc4', border: '1px solid rgba(59,127,196,.2)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><IconLink /> FK → {f.fk}</span>}
                            {f.unique && <span style={{ fontSize: '.68rem', padding: '1px 7px', borderRadius: 4, background: '#f0eefa', color: '#6b5fb0', border: '1px solid rgba(107,95,176,.2)', fontWeight: 700 }}>UNIQUE</span>}
                          </div>
                        </td>
                        <td style={{ padding: '9px 14px', color: 'var(--text-2)', lineHeight: 1.5 }}>{f.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Tech stack */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-warm)',
          borderRadius: 'var(--r-xl)', padding: '20px 22px', boxShadow: 'var(--shadow-sm)',
        }}>
          <h3 style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 12 }}>Database technology stack</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {[
              { label: 'ORM', value: 'SQLAlchemy 2.0 (async)' },
              { label: 'Dev database', value: 'SQLite + aiosqlite' },
              { label: 'Production', value: 'PostgreSQL (ready)' },
              { label: 'Migration tool', value: 'Alembic (configured)' },
              { label: 'ID strategy', value: 'UUID4 (non-sequential)' },
              { label: 'Session scope', value: 'Async per-request' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', padding: '10px 12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.82rem', color: 'var(--text)', fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default DatabaseDesign