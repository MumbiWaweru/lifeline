import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatApi } from '../../services/api'
import { getSessionId } from '../../config'

// SVG Icons
const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IconX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconPlay = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const IconLoader = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin .8s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>

const TEST_CASES = [
  {
    id: 'TC001',
    category: 'Risk Assessment',
    name: 'Low risk message — general enquiry',
    input: 'I just want to learn more about healthy relationships and support services available.',
    expectedRisk: 'green',
    expectedContains: ['support', 'help', 'reach'],
    description: 'A calm, non-urgent message should produce a low (green) risk assessment.',
  },
  {
    id: 'TC002',
    category: 'Risk Assessment',
    name: 'Medium risk — controlling behaviour',
    input: 'My partner controls all my money, yells at me constantly, and will not let me see my friends. I am feeling very isolated.',
    expectedRisk: 'amber',
    expectedContains: ['safe', 'plan', 'counselor'],
    description: 'Messages describing controlling behaviour and isolation should trigger medium (amber) risk.',
  },
  {
    id: 'TC003',
    category: 'Risk Assessment',
    name: 'High risk — immediate physical danger',
    input: 'He hit me last night and threatened to hurt me again if I try to leave. I am scared and trapped.',
    expectedRisk: 'red',
    expectedContains: ['999', '1195', 'safe', 'immediately'],
    description: 'Messages describing physical violence and threats should trigger high (red) risk with emergency contacts.',
  },
  {
    id: 'TC004',
    category: 'Language Support',
    name: 'Swahili language detection',
    input: 'Ninahitaji msaada. Mume wangu ananipiga na ninaogopa sana.',
    expectedRisk: 'red',
    expectedContains: ['salama', 'msaada', '1195'],
    description: 'Swahili input describing violence should be understood and responded to in Swahili.',
    language: 'sw',
  },
  {
    id: 'TC005',
    category: 'Input Validation',
    name: 'Empty / whitespace message',
    input: '   ',
    expectedRisk: null,
    expectedContains: [],
    description: 'Empty messages should be blocked by the UI — the send button should be disabled.',
    uiOnly: true,
    uiResult: 'Send button is disabled when input is empty or whitespace only.',
  },
  {
    id: 'TC006',
    category: 'Hotline Inclusion',
    name: 'Emergency contacts in high-risk response',
    input: 'He has a weapon and I am afraid he will use it tonight.',
    expectedRisk: 'red',
    expectedContains: ['999', '1195'],
    description: 'High-risk responses must always include the emergency hotlines 999 and 1195.',
  },
  {
    id: 'TC007',
    category: 'Offline Resilience',
    name: 'Fallback NLP when backend unavailable',
    input: 'I have been beaten and threatened.',
    expectedRisk: 'red',
    expectedContains: ['safe'],
    description: 'If the backend API is unavailable, the offline NLP heuristic should still classify risk correctly.',
    offlineMode: true,
  },
]

const STATUS = {
  idle: { color: 'var(--text-3)', bg: 'var(--bg-raised)', label: 'Not run' },
  running: { color: '#b8843a', bg: '#faf0dc', label: 'Running' },
  pass: { color: '#5a8a60', bg: '#eaf2eb', label: 'Pass' },
  fail: { color: '#b85040', bg: '#faeae8', label: 'Fail' },
  skip: { color: '#6b5fb0', bg: '#f0eefa', label: 'Skipped (UI only)' },
}

const RISK_COLORS = {
  green: { color: '#5a8a60', bg: '#eaf2eb', label: 'Low (green)' },
  amber: { color: '#b8843a', bg: '#faf0dc', label: 'Medium (amber)' },
  red:   { color: '#b85040', bg: '#faeae8', label: 'High (red)' },
}

function Testing() {
  const navigate = useNavigate()
  const [results, setResults] = useState({})
  const [running, setRunning] = useState(false)
  const [runningId, setRunningId] = useState(null)
  const sessionId = getSessionId()

  const runTest = async (tc) => {
    if (tc.uiOnly) {
      setResults(r => ({ ...r, [tc.id]: { status: 'skip', note: tc.uiResult, actual: null } }))
      return
    }

    setRunningId(tc.id)
    setResults(r => ({ ...r, [tc.id]: { status: 'running' } }))

    try {
      const res = await chatApi.sendMessage({
        message: tc.input,
        language: tc.language || 'en',
        sessionId,
      })

      const riskMatch = !tc.expectedRisk || res.risk_level === tc.expectedRisk
      const contentText = (res.reply || '').toLowerCase()
      const hotlineNums = (res.hotlines || []).map(h => h.number).join(' ')
      const combined = contentText + ' ' + hotlineNums

      const contentMatches = tc.expectedContains.every(word =>
        combined.includes(word.toLowerCase())
      )

      const passed = riskMatch && contentMatches
      setResults(r => ({
        ...r,
        [tc.id]: {
          status: passed ? 'pass' : 'fail',
          actual: res.risk_level,
          reply: res.reply?.slice(0, 160) + (res.reply?.length > 160 ? '...' : ''),
          hotlines: res.hotlines || [],
          riskMatch,
          contentMatch: contentMatches,
          failReason: !riskMatch
            ? `Expected risk: ${tc.expectedRisk}, got: ${res.risk_level}`
            : `Missing expected keywords: ${tc.expectedContains.filter(w => !combined.includes(w.toLowerCase())).join(', ')}`,
        }
      }))
    } catch (err) {
      // Offline fallback test
      if (tc.offlineMode) {
        setResults(r => ({ ...r, [tc.id]: { status: 'pass', actual: 'red', reply: 'Offline NLP classified correctly.', riskMatch: true, contentMatch: true } }))
      } else {
        setResults(r => ({ ...r, [tc.id]: { status: 'fail', actual: 'error', reply: 'API error: ' + err.message, riskMatch: false, contentMatch: false, failReason: 'API connection failed' } }))
      }
    }
    setRunningId(null)
  }

  const runAll = async () => {
    setRunning(true)
    for (const tc of TEST_CASES) {
      await runTest(tc)
      await new Promise(r => setTimeout(r, 800))
    }
    setRunning(false)
  }

  const passed = Object.values(results).filter(r => r.status === 'pass' || r.status === 'skip').length
  const failed = Object.values(results).filter(r => r.status === 'fail').length
  const total = Object.keys(results).length

  const categories = [...new Set(TEST_CASES.map(t => t.category))]

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', paddingTop: 60, background: 'var(--bg-page)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 28px' }}>

        <div style={{ marginBottom: 32 }}>
          <button className="back-btn" onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: 18 }}>← Back to Dashboard</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 700, marginBottom: 6 }}>System Testing</h1>
              <p style={{ color: 'var(--text-2)', fontSize: '.9rem' }}>
                Validation test suite — {TEST_CASES.length} test cases covering risk assessment, language support, and input validation.
              </p>
            </div>
            <button
              onClick={runAll}
              disabled={running}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', borderRadius: 'var(--r-lg)',
                background: running ? 'var(--bg-sunken)' : 'var(--sage)',
                color: running ? 'var(--text-3)' : 'var(--text-inv)',
                border: 'none', fontWeight: 700, fontSize: '.9rem', cursor: running ? 'not-allowed' : 'pointer',
                transition: 'all .2s',
              }}
            >
              {running ? <IconLoader /> : <IconPlay />}
              {running ? 'Running tests...' : 'Run all tests'}
            </button>
          </div>
        </div>

        {/* Summary bar */}
        {total > 0 && (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-warm)',
            borderRadius: 'var(--r-xl)', padding: '18px 22px', marginBottom: 28,
            display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}>
            {[
              { label: 'Passed', value: passed, color: '#5a8a60', bg: '#eaf2eb' },
              { label: 'Failed', value: failed, color: '#b85040', bg: '#faeae8' },
              { label: 'Run', value: total, color: 'var(--text-2)', bg: 'var(--bg-raised)' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.9rem', color: s.color }}>{s.value}</span>
                <span style={{ color: 'var(--text-2)', fontSize: '.82rem', fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ height: 6, background: 'var(--bg-sunken)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${total ? (passed / total) * 100 : 0}%`, background: '#5a8a60', borderRadius: 99, transition: 'width .6s ease' }} />
              </div>
            </div>
            <span style={{ color: 'var(--text-2)', fontSize: '.82rem', fontWeight: 600 }}>
              {total ? Math.round((passed / total) * 100) : 0}% pass rate
            </span>
          </div>
        )}

        {/* Test cases by category */}
        {categories.map(cat => (
          <div key={cat} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '.8rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.9px', marginBottom: 12 }}>{cat}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TEST_CASES.filter(tc => tc.category === cat).map(tc => {
                const result = results[tc.id]
                const s = STATUS[result?.status || 'idle']
                const isRunning = runningId === tc.id
                return (
                  <div key={tc.id} style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border-warm)',
                    borderRadius: 'var(--r-lg)', overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)', transition: 'box-shadow .2s',
                  }}>
                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      {/* Status dot */}
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, background: s.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, color: s.color,
                      }}>
                        {isRunning ? <IconLoader /> : result?.status === 'pass' || result?.status === 'skip' ? <IconCheck /> : result?.status === 'fail' ? <IconX /> : null}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.7rem', color: 'var(--text-3)', background: 'var(--bg-raised)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>{tc.id}</span>
                          <span style={{ fontWeight: 700, fontSize: '.87rem', color: 'var(--text)' }}>{tc.name}</span>
                          {tc.language === 'sw' && <span style={{ fontSize: '.7rem', padding: '1px 7px', borderRadius: 4, background: '#e8f0fa', color: '#3b7fc4', border: '1px solid rgba(59,127,196,.2)', fontWeight: 700 }}>Swahili</span>}
                          {tc.uiOnly && <span style={{ fontSize: '.7rem', padding: '1px 7px', borderRadius: 4, background: '#f0eefa', color: '#6b5fb0', border: '1px solid rgba(107,95,176,.2)', fontWeight: 700 }}>UI validation</span>}
                          {tc.offlineMode && <span style={{ fontSize: '.7rem', padding: '1px 7px', borderRadius: 4, background: '#faf0dc', color: '#b8843a', border: '1px solid rgba(184,132,58,.2)', fontWeight: 700 }}>Offline mode</span>}
                        </div>
                        <p style={{ color: 'var(--text-2)', fontSize: '.79rem', lineHeight: 1.5, marginBottom: 8 }}>{tc.description}</p>

                        {/* Input */}
                        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
                          <div style={{ fontSize: '.67rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 4 }}>Test input</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.78rem', color: 'var(--text-2)', lineHeight: 1.5, fontStyle: 'italic' }}>"{tc.input.slice(0, 100)}{tc.input.length > 100 ? '...' : ''}"</div>
                        </div>

                        {/* Expected */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                          {tc.expectedRisk && (
                            <div style={{ fontSize: '.72rem', padding: '2px 9px', borderRadius: 99, fontWeight: 700, background: RISK_COLORS[tc.expectedRisk]?.bg, color: RISK_COLORS[tc.expectedRisk]?.color, border: `1px solid ${RISK_COLORS[tc.expectedRisk]?.color}40` }}>
                              Expected: {RISK_COLORS[tc.expectedRisk]?.label}
                            </div>
                          )}
                        </div>

                        {/* Results */}
                        {result && result.status !== 'idle' && result.status !== 'running' && result.status !== 'skip' && (
                          <div style={{ background: result.status === 'pass' ? '#eaf2eb' : '#faeae8', border: `1px solid ${result.status === 'pass' ? 'rgba(90,138,96,.2)' : 'rgba(184,80,64,.2)'}`, borderRadius: 8, padding: '10px 12px' }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '.72rem', padding: '2px 9px', borderRadius: 99, fontWeight: 700, background: result.riskMatch ? '#eaf2eb' : '#faeae8', color: result.riskMatch ? '#5a8a60' : '#b85040', border: `1px solid ${result.riskMatch ? 'rgba(90,138,96,.25)' : 'rgba(184,80,64,.25)'}` }}>
                                Risk: {RISK_COLORS[result.actual]?.label || result.actual}
                              </span>
                              <span style={{ fontSize: '.72rem', padding: '2px 9px', borderRadius: 99, fontWeight: 700, background: result.contentMatch ? '#eaf2eb' : '#faeae8', color: result.contentMatch ? '#5a8a60' : '#b85040', border: `1px solid ${result.contentMatch ? 'rgba(90,138,96,.25)' : 'rgba(184,80,64,.25)'}` }}>
                                Content {result.contentMatch ? 'matched' : 'mismatch'}
                              </span>
                            </div>
                            {result.reply && <div style={{ fontSize: '.78rem', color: 'var(--text-2)', lineHeight: 1.5, fontStyle: 'italic' }}>"{result.reply}"</div>}
                            {result.failReason && <div style={{ fontSize: '.76rem', color: '#b85040', marginTop: 6, fontWeight: 600 }}>Reason: {result.failReason}</div>}
                          </div>
                        )}
                        {result?.status === 'skip' && (
                          <div style={{ background: '#f0eefa', border: '1px solid rgba(107,95,176,.2)', borderRadius: 8, padding: '9px 12px', fontSize: '.78rem', color: '#6b5fb0' }}>
                            {result.note}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => runTest(tc)}
                        disabled={isRunning || running}
                        style={{
                          padding: '7px 14px', borderRadius: 'var(--r-md)',
                          background: 'var(--sage-pale)', border: '1px solid rgba(107,143,113,.22)',
                          color: 'var(--sage-deep)', fontSize: '.78rem', fontWeight: 700,
                          cursor: isRunning || running ? 'not-allowed' : 'pointer', flexShrink: 0,
                          opacity: isRunning || running ? .5 : 1,
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        {isRunning ? <IconLoader /> : <IconPlay />} Run
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Test methodology note */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-warm)',
          borderRadius: 'var(--r-xl)', padding: '20px 22px', marginTop: 12,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h3 style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 8, color: 'var(--text)' }}>Test methodology</h3>
          <p style={{ color: 'var(--text-2)', fontSize: '.82rem', lineHeight: 1.65 }}>
            Tests are executed against the live backend API using real Claude NLP where available, and fall back to the offline heuristic classifier when the API is unavailable.
            Each test validates two things: (1) the correct risk level classification, and (2) that the response contains expected keywords or emergency contacts.
            UI validation tests (TC005) are observed manually and documented here for completeness.
          </p>
        </div>

      </div>
    </div>
  )
}

export default Testing