import { createContext, useContext, useState } from 'react'

const RiskContext = createContext()

// ── Shared config — import this anywhere you need colours/labels ──────────────
export const RISK_CONFIG = {
  low: {
    label:  'Low Risk',
    color:  '#3B6D11',
    bg:     '#EAF3DE',
    border: '#5a8a60',
    pulse:  false,
  },
  medium: {
    label:  'Medium Risk',
    color:  '#854F0B',
    bg:     '#FAEEDA',
    border: '#b8843a',
    pulse:  false,
  },
  high: {
    label:  'High Risk',
    color:  '#A32D2D',
    bg:     '#FCEBEB',
    border: '#b85040',
    pulse:  true,
  },
  critical: {
    label:  'Critical Risk',
    color:  '#7B1C1C',
    bg:     '#F7C1C1',
    border: '#9B1C1C',
    pulse:  true,
  },
}

// Map legacy backend values (green/amber/red) to new 4-level system
const LEGACY_MAP = {
  green: 'low',
  amber: 'medium',
  red:   'high',
}

function normaliseLevel(level) {
  if (!level) return 'low'
  const lower = level.toLowerCase()
  return LEGACY_MAP[lower] ?? (RISK_CONFIG[lower] ? lower : 'low')
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function RiskProvider({ children }) {
  const [riskLevel, setRiskLevelRaw] = useState('low')
  const [riskScore, setRiskScore]    = useState(0)

  // Always normalise before storing so the rest of the app never sees
  // "green", "amber", "red", or undefined
  const setRiskLevel = (level) => setRiskLevelRaw(normaliseLevel(level))

  // Client-side risk check for instant UI feedback while the API call is in flight
  const assessRisk = (message) => {
    const criticalKeywords = [
      'kill me', 'going to kill', 'will kill', 'knife', 'gun', 'weapon',
      'strangling', 'choking', "can't breathe", 'rape', 'sexually assaulted',
    ]
    const highKeywords = [
      'hit', 'beat', 'punch', 'slap', 'hurt me', 'bruise', 'hospital',
      'escape', "can't leave", 'afraid to leave', 'run away',
    ]
    const mediumKeywords = [
      'shout', 'yell', 'threaten', 'control', 'isolate', 'jealous',
      'humiliate', 'money', 'salary', 'online', 'hacked', 'tracking',
    ]

    const lower = message.toLowerCase()
    const criticalCount = criticalKeywords.filter(kw => lower.includes(kw)).length
    const highCount     = highKeywords.filter(kw => lower.includes(kw)).length
    const mediumCount   = mediumKeywords.filter(kw => lower.includes(kw)).length

    let level = 'low'
    if (criticalCount >= 1) {
      level = 'critical'
    } else if (highCount >= 1 || (highCount >= 1 && mediumCount >= 1)) {
      level = 'high'
    } else if (mediumCount >= 2 || highCount >= 1) {
      level = 'medium'
    }

    setRiskLevelRaw(level)
    return level
  }

  const clearRisk = () => {
    setRiskLevelRaw('low')
    setRiskScore(0)
  }

  return (
    <RiskContext.Provider value={{
      riskLevel,
      riskScore,
      setRiskLevel,
      setRiskScore,
      assessRisk,
      clearRisk,
      config: RISK_CONFIG[riskLevel] ?? RISK_CONFIG.low,
    }}>
      {children}
    </RiskContext.Provider>
  )
}

export function useRisk() {
  return useContext(RiskContext)
}