// RiskIndicator.jsx — 4-level risk indicator with pulse animation for high/critical
import { useRisk, RISK_CONFIG } from '../context/RiskContext'

export default function RiskIndicator() {
  const { riskLevel, riskScore } = useRisk()
  const cfg = RISK_CONFIG[riskLevel] ?? RISK_CONFIG.low

  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          8,
      background:   cfg.bg,
      border:       `1.5px solid ${cfg.border}`,
      borderRadius: 20,
      padding:      '5px 14px',
      fontSize:     13,
      fontWeight:   600,
      color:        cfg.color,
      position:     'relative',
      overflow:     'hidden',
      transition:   'background 0.3s, border-color 0.3s, color 0.3s',
    }}>

      {/* Dot — pulses for high and critical */}
      <span style={{
        display:      'inline-block',
        width:        cfg.pulse ? 10 : 8,
        height:       cfg.pulse ? 10 : 8,
        borderRadius: '50%',
        background:   cfg.border,
        flexShrink:   0,
        animation:    cfg.pulse ? 'pulseRing 1.2s ease-out infinite' : 'none',
      }} />

      <span>{cfg.label}</span>

      {/* Show percentage score if available */}
      {riskScore > 0 && (
        <span style={{
          fontSize:   11,
          fontWeight: 400,
          opacity:    0.75,
          marginLeft: 2,
        }}>
          {Math.round(riskScore * 100)}%
        </span>
      )}
    </div>
  )
}