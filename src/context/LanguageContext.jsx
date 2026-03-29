import { createContext, useContext, useState } from 'react'

const translations = {
  en: {
    landing: {
      title: 'Lifeline',
      subtitle: 'Confidential GBV Support',
      description: 'Get immediate support and connect with local resources. Your safety is our priority.',
      survivorButton: 'I Need Help',
      adminButton: 'Admin Login',
    },
    quickExit: 'Quick Exit',
    language: 'Language',
    riskLevels: {
      low: 'Low Risk',
      medium: 'Medium Risk',
      high: 'High Risk',
    },
    chatbot: {
      title: 'How can we help?',
      placeholder: 'Describe your situation...',
      send: 'Send',
      welcome: 'Hello, I\'m here to help. Please share what you\'re going through, and I\'ll provide guidance and resources.',
    },
    resources: {
      title: 'Local Resources',
      hotlines: 'Hotlines',
      shelters: 'Shelters',
      organizations: 'Organizations',
      police: 'Police',
    },
  },
  sw: {
    landing: {
      title: 'Lifeline',
      subtitle: 'Msaada wa Siri wa UKB',
      description: 'Pata msaada wa haraka na uungane na rasilimali za ndani. Usalama wako ni kipaumbele chetu.',
      survivorButton: 'Nahitaji Msaada',
      adminButton: 'Ingia kama Msimamizi',
    },
    quickExit: 'Toka Haraka',
    language: 'Lugha',
    riskLevels: {
      low: 'Hatari Ndogo',
      medium: 'Hatari ya Kati',
      high: 'Hatari Kubwa',
    },
    chatbot: {
      title: 'Tunaweza kukusaidiaje?',
      placeholder: 'Eleza hali yako...',
      send: 'Tuma',
      welcome: 'Habari, nipo hapa kukusaidia. Tafadhali shiriki unachopitia, na nitatoa mwongozo na rasilimali.',
    },
    resources: {
      title: 'Rasilimali za Ndani',
      hotlines: 'Mikondo ya Simu',
      shelters: 'Malazi',
      organizations: 'Mashirika',
      police: 'Polisi',
    },
  },
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en')

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'sw' : 'en')
  }

  const t = (key) => {
    const keys = key.split('.')
    let value = translations[language]
    for (const k of keys) {
      value = value?.[k]
    }
    return value || key
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
