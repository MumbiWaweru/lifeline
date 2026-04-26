// RiskExplanation.jsx — LIME-style per-phrase explanation widget
import { useRisk, RISK_CONFIG } from "../context/RiskContext";

const LABEL_COLORS = {
  critical: { bar: "#A32D2D", text: "#501313", bg: "#FCEBEB" },
  high:     { bar: "#E24B4A", text: "#A32D2D", bg: "#FCEBEB" },
  medium:   { bar: "#EF9F27", text: "#854F0B", bg: "#FAEEDA" },
  low:      { bar: "#639922", text: "#3B6D11", bg: "#EAF3DE"  },
};

export default function RiskExplanation({ explanation = [], riskLevel = "low", riskScore = 0, confidence = 0 }) {
  if (!explanation || explanation.length === 0) return null;

  const cfg   = RISK_CONFIG[riskLevel] || RISK_CONFIG.low;
  const badge = LABEL_COLORS[riskLevel] || LABEL_COLORS.low;

  return (
    <div style={{
      background: "#FAFAFA",
      border: `1px solid ${cfg.border}`,
      borderRadius: 10,
      padding: "14px 16px",
      marginTop: 10,
      fontSize: 13,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{
          background: badge.bg,
          color: badge.text,
          fontWeight: 600,
          fontSize: 11,
          padding: "3px 10px",
          borderRadius: 20,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          {riskLevel} risk
        </span>
        <span style={{ color: "#888", fontSize: 12 }}>
          Score: {(riskScore * 100).toFixed(0)}% · Confidence: {(confidence * 100).toFixed(0)}%
        </span>
      </div>

      {/* Per-phrase bars */}
      <div style={{ marginBottom: 4, color: "#555", fontWeight: 500, fontSize: 12 }}>
        Key risk indicators:
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {explanation.map((item, i) => {
          const lc     = LABEL_COLORS[item.label] || LABEL_COLORS.low;
          const pct    = Math.round((item.score || 0) * 100);
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ color: "#333", fontStyle: "italic" }}>
                  &ldquo;{item.phrase}&rdquo;
                </span>
                <span style={{
                  background: lc.bg,
                  color: lc.text,
                  fontSize: 11,
                  padding: "1px 7px",
                  borderRadius: 10,
                  fontWeight: 600,
                }}>
                  {pct}%
                </span>
              </div>
              {/* Bar */}
              <div style={{
                height: 4,
                borderRadius: 4,
                background: "#E5E5E5",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: lc.bar,
                  borderRadius: 4,
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}