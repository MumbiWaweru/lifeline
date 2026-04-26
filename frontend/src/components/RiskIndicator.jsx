// RiskIndicator.jsx — 4-level risk indicator with pulse animation
import { useRisk, RISK_CONFIG } from "../context/RiskContext";

export default function RiskIndicator() {
  const { riskLevel, riskScore } = useRisk();
  const cfg = RISK_CONFIG[riskLevel] || RISK_CONFIG.low;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: cfg.bg,
      border: `1.5px solid ${cfg.border}`,
      borderRadius: 20,
      padding: "5px 14px",
      fontSize: 13,
      fontWeight: 600,
      color: cfg.color,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Pulse ring for high/critical */}
      {cfg.pulse && (
        <span style={{
          display: "inline-block",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: cfg.border,
          animation: "pulseRing 1.2s ease-out infinite",
          flexShrink: 0,
        }} />
      )}
      {!cfg.pulse && (
        <span style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: cfg.border,
          flexShrink: 0,
        }} />
      )}
      <span>{cfg.label}</span>
      {riskScore > 0 && (
        <span style={{
          fontSize: 11,
          fontWeight: 400,
          opacity: 0.75,
          marginLeft: 2,
        }}>
          {Math.round(riskScore * 100)}%
        </span>
      )}
    </div>
  );
}