import { useRisk } from '../context/RiskContext'
import { useLanguage } from '../context/LanguageContext'

function RiskIndicator() {
  const { riskLevel } = useRisk()
  const { t } = useLanguage()

  const getRiskDisplay = (level) => {
    const mappings = {
      green: { label: t('riskLevels.low') || 'Low Risk', class: 'risk-low', dot: '•' },
      amber: { label: t('riskLevels.medium') || 'Medium Risk', class: 'risk-medium', dot: '•' },
      red: { label: t('riskLevels.high') || 'High Risk', class: 'risk-high', dot: '•' },
      low: { label: t('riskLevels.low') || 'Low Risk', class: 'risk-low', dot: '•' },
      medium: { label: t('riskLevels.medium') || 'Medium Risk', class: 'risk-medium', dot: '•' },
      high: { label: t('riskLevels.high') || 'High Risk', class: 'risk-high', dot: '•' },
    }
    return mappings[level] || mappings.green
  }

  const display = getRiskDisplay(riskLevel)

  if (!riskLevel) {
    return (
      <span className="risk-indicator risk-low">
        {display.dot} {t('riskLevels.low')}
      </span>
    )
  }

  return (
    <span className={`risk-indicator ${display.class}`}>
      {display.dot} {display.label}
    </span>
  )
}

export default RiskIndicator
