import { createContext, useContext, useState } from 'react'

const RiskContext = createContext()

export function RiskProvider({ children }) {
  const [riskLevel, setRiskLevel] = useState(null) // 'low', 'medium', 'high' or 'green', 'amber', 'red'
  const [riskFactors, setRiskFactors] = useState([])

  const assessRisk = (message) => {
    const highRiskKeywords = [
      'kill', 'murder', 'weapon', 'gun', 'knife', 'choke', 'strangle',
      'threaten', 'death', 'suicide', 'hospital', 'blood', 'broken',
      'rape', 'assault', 'attack', 'hurt', 'pain', 'scared', 'danger'
    ]
    
    const mediumRiskKeywords = [
      'shout', 'yell', 'angry', 'alcohol', 'drunk', 'control', 'money',
      'isolate', 'follow', 'watch', 'jealous', 'accuse', 'blame'
    ]

    const lowerMessage = message.toLowerCase()
    
    const highRiskCount = highRiskKeywords.filter(keyword => 
      lowerMessage.includes(keyword)
    ).length
    
    const mediumRiskCount = mediumRiskKeywords.filter(keyword => 
      lowerMessage.includes(keyword)
    ).length

    let level = 'low'
    if (highRiskCount >= 2 || (highRiskCount >= 1 && mediumRiskCount >= 2)) {
      level = 'high'
    } else if (highRiskCount >= 1 || mediumRiskCount >= 2) {
      level = 'medium'
    }

    setRiskLevel(level)
    return level
  }

  const clearRisk = () => {
    setRiskLevel(null)
    setRiskFactors([])
  }

  return (
    <RiskContext.Provider value={{ riskLevel, riskFactors, assessRisk, setRiskLevel, clearRisk }}>
      {children}
    </RiskContext.Provider>
  )
}

export function useRisk() {
  return useContext(RiskContext)
}
