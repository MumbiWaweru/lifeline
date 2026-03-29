import { useRisk } from '../context/RiskContext'
import { useLanguage } from '../context/LanguageContext'

function RiskIndicator() {
  const { riskLevel } = useRisk()
  const { t } = useLanguage()

  // Map backend risk levels (green/amber/red) to display
  const getRiskDisplay = (level) => {
    const mappings = {
      green: { label: t('riskLevels.low') || 'Low Risk', class: 'risk-low', icon: '🟢' },
      amber: { label: t('riskLevels.medium') || 'Medium Risk', class: 'risk-medium', icon: '🟡' },
      red: { label: t('riskLevels.high') || 'High Risk', class: 'risk-high', icon: '🔴' },
      low: { label: t('riskLevels.low') || 'Low Risk', class: 'risk-low', icon: '🟢' },
      medium: { label: t('riskLevels.medium') || 'Medium Risk', class: 'risk-medium', icon: '🟡' },
      high: { label: t('riskLevels.high') || 'High Risk', class: 'risk-high', icon: '🔴' },
    }
    return mappings[level] || mappings.green
  }

  const display = getRiskDisplay(riskLevel)

  if (!riskLevel) {
    return (
      <span className="risk-indicator risk-low">
        🟢 {t('riskLevels.low')}
      </span>
    )
  }

  return (
    <span className={`risk-indicator ${display.class}`}>
      {display.icon} {display.label}
    </span>
  )
}

export default RiskIndicator
