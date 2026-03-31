import { useLanguage } from '../context/LanguageContext'

function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage()

  return (
    <button 
      className="lang-toggle"
      onClick={toggleLanguage}
    >
      🌐 {language === 'en' ? 'English' : 'Kiswahili'}
    </button>
  )
}

export default LanguageToggle
