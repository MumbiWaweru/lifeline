// contexts/DiscreetModeContext.tsx
// "Discreet Mode" — transforms app UI to look like a weather/news app (per report §5.4)
// Activates via keyboard shortcut (Ctrl+Shift+D) or the toggle in settings

import React, {
  createContext, useContext, useState, useEffect, useCallback, ReactNode
} from 'react'

interface DiscreetModeContextValue {
  isDiscreet: boolean
  toggle: () => void
  activate: () => void
  deactivate: () => void
}

const DiscreetModeContext = createContext<DiscreetModeContextValue>({
  isDiscreet: false,
  toggle: () => {},
  activate: () => {},
  deactivate: () => {},
})

export function DiscreetModeProvider({ children }: { children: ReactNode }) {
  const [isDiscreet, setIsDiscreet] = useState(false)

  const activate   = useCallback(() => setIsDiscreet(true),  [])
  const deactivate = useCallback(() => setIsDiscreet(false), [])
  const toggle     = useCallback(() => setIsDiscreet(p => !p), [])

  // Keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggle])

  // Apply body class for global CSS override
  useEffect(() => {
    document.body.classList.toggle('discreet-mode', isDiscreet)
    document.title = isDiscreet ? 'Nairobi Weather — Clear skies' : 'LIFELINE'
    // Change favicon in discreet mode
    const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']")
    if (favicon) {
      favicon.href = isDiscreet ? '/favicon-weather.ico' : '/favicon.ico'
    }
  }, [isDiscreet])

  return (
    <DiscreetModeContext.Provider value={{ isDiscreet, toggle, activate, deactivate }}>
      {children}
    </DiscreetModeContext.Provider>
  )
}

export const useDiscreetMode = () => useContext(DiscreetModeContext)


// ─── Discreet Mode Overlay — renders a convincing weather app UI ───────────────
export function DiscreetModeOverlay() {
  const { isDiscreet, deactivate } = useDiscreetMode()
  if (!isDiscreet) return null

  const date = new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(160deg, #1a73e8 0%, #0d47a1 60%, #1565c0 100%)',
        color: '#fff', fontFamily: 'system-ui, sans-serif',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'flex-start', padding: '48px 24px 0',
      }}
      aria-label="Weather application (discreet mode active)"
    >
      {/* Location bar */}
      <p style={{ margin: 0, fontSize: 14, opacity: 0.85 }}>📍 Nairobi, Kenya</p>
      <p style={{ margin: '4px 0 24px', fontSize: 13, opacity: 0.7 }}>{date}</p>

      {/* Big temp */}
      <div style={{ fontSize: 88, fontWeight: 300, lineHeight: 1 }}>24°</div>
      <div style={{ fontSize: 18, marginTop: 8, opacity: 0.9 }}>Partly Cloudy</div>

      {/* Daily range */}
      <div style={{ marginTop: 16, fontSize: 14, opacity: 0.75 }}>
        H: 27°C &nbsp;·&nbsp; L: 18°C
      </div>

      {/* Fake weather tiles */}
      <div
        style={{
          marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)',
          gap: 16, width: '100%', maxWidth: 420,
        }}
      >
        {['MON','TUE','WED','THU','FRI'].map((day, i) => (
          <div key={day} style={{ textAlign: 'center', opacity: 0.8 }}>
            <div style={{ fontSize: 11, marginBottom: 6 }}>{day}</div>
            <div style={{ fontSize: 22 }}>{['🌤','☁️','🌦','🌤','☀️'][i]}</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>{[24,22,19,25,27][i]}°</div>
          </div>
        ))}
      </div>

      {/* UV / Humidity / Wind row */}
      <div
        style={{
          marginTop: 40, display: 'flex', gap: 32,
          fontSize: 13, opacity: 0.75, borderTop: '1px solid rgba(255,255,255,0.2)',
          paddingTop: 20, width: '100%', maxWidth: 420, justifyContent: 'center',
        }}
      >
        <span>💧 Humidity: 62%</span>
        <span>🌬 Wind: 14 km/h</span>
        <span>☀️ UV: Moderate</span>
      </div>

      {/* Hidden return instruction */}
      <button
        onClick={deactivate}
        style={{
          marginTop: 60, background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
          color: 'rgba(255,255,255,0.4)', borderRadius: 20, padding: '6px 18px',
          cursor: 'pointer', fontSize: 11,
        }}
        aria-label="Exit discreet mode"
      >
        Ctrl+Shift+D to exit · Tap here
      </button>
    </div>
  )
}