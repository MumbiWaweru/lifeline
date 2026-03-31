import { useRisk } from '../context/RiskContext'
import { useLanguage } from '../context/LanguageContext'

function RiskIndicator() {
  const { riskLevel } = useRisk()
  const { t } = useLanguage()

  if (!riskLevel) {
    return (
      <span className="risk-indicator risk-low">
        🟢 {t('riskLevels.low')}
      </span>
    )
  }

  const riskClass = `risk-${riskLevel}`
  const riskLabel = t(`riskLevels.${riskLevel}`)
  
  const icons = {
    low: '🟢',
    medium: '🟡',
    high: '🔴'
  }

  return (
    <span className={`risk-indicator ${riskClass}`}>
      {icons[riskLevel]} {riskLabel}
    </span>
  )
}

export default RiskIndicator
