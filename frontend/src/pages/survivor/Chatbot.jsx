import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useRisk } from '../../context/RiskContext'

function Chatbot() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { assessRisk } = useRisk()
  
  const [messages, setMessages] = useState([
    { id: 1, text: t('chatbot.welcome'), isUser: false }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage = { id: Date.now(), text: inputValue, isUser: true }
    setMessages(prev => [...prev, userMessage])
    
    // Assess risk level based on message
    assessRisk(inputValue)
    
    setInputValue('')
    setIsLoading(true)

    // Simulate AI response (replace with actual API call to backend)
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        text: getSimulatedResponse(inputValue),
        isUser: false
      }
      setMessages(prev => [...prev, botMessage])
      setIsLoading(false)
    }, 1500)
  }

  const getSimulatedResponse = (message) => {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('danger') || lowerMessage.includes('scared') || lowerMessage.includes('hurt')) {
      return "I hear that you're in a difficult situation. Your safety is the most important thing. Would you like me to connect you with immediate support resources in your area?"
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return "I'm here to help. Can you tell me more about what you're experiencing? This will help me provide you with the most relevant resources."
    }
    
    return "Thank you for sharing. I understand this is difficult. Based on what you've told me, I can help connect you with appropriate resources. Would you like to see available support options?"
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSeeResults = () => {
    navigate('/results')
  }

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card-custom" style={{ minHeight: '70vh' }}>
            <h3 className="mb-4 text-center" style={{ color: 'var(--color-primary-light)' }}>
              {t('chatbot.title')}
            </h3>

            {/* Chat Messages */}
            <div className="mb-4" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-bubble ${msg.isUser ? 'chat-bubble-user' : 'chat-bubble-bot'}`}
                >
                  <p className="mb-0">{msg.text}</p>
                </div>
              ))}
              
              {isLoading && (
                <div className="chat-bubble chat-bubble-bot">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="mb-3">
              <textarea
                className="form-control"
                rows="3"
                placeholder={t('chatbot.placeholder')}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--color-primary-border)',
                  color: 'var(--color-text)',
                  resize: 'none'
                }}
              />
            </div>

            <div className="d-grid gap-2">
              <button
                className="btn btn-primary-custom"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
              >
                📤 {t('chatbot.send')}
              </button>
              
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handleSeeResults}
                style={{ 
                  borderColor: 'var(--color-primary-border)',
                  color: 'var(--color-primary-light)'
                }}
              >
                See Support Resources →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chatbot
