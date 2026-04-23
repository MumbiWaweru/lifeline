import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { counsellorsApi } from '../../services/api'
import { getSessionId } from '../../config'

function Counsellors() {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const [counsellors, setCounsellors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCounsellor, setSelectedCounsellor] = useState(null)
  const [requesting, setRequesting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)

  useEffect(() => {
    const fetchCounsellors = async () => {
      try {
        setLoading(true)
        const data = await counsellorsApi.getAll()
        setCounsellors(data)
      } catch (err) {
        console.error('Failed to fetch counsellors:', err)
        setError('Failed to load counsellors')
      } finally {
        setLoading(false)
      }
    }

    fetchCounsellors()
  }, [])

  const handleRequestCounsellor = async (counsellorId) => {
    setRequesting(true)
    setError(null)
    setRequestSuccess(false)

    try {
      const sessionId = getSessionId()
      await counsellorsApi.requestCounsellor({
        counsellor_id: counsellorId,
        session_id: sessionId,
      })
      setRequestSuccess(true)
      setTimeout(() => {
        setRequestSuccess(false)
        setSelectedCounsellor(null)
      }, 3000)
    } catch (err) {
      console.error('Failed to request counsellor:', err)
      setError(err.message || 'Failed to request counsellor')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3" style={{ color: 'var(--color-text-secondary)' }}>Loading counsellors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8">
          <div className="resources-page-header mb-4">
            <h2 className="text-gradient mb-2">
              {language === 'sw' ? 'Washauri' : 'Counsellors'}
            </h2>
            <p className="text-secondary">
              {language === 'sw' 
                ? 'Wasiliana na washauri wetu waliofunzwa kwa msaada wa kibinafsi' 
                : 'Connect with our trained counsellors for personalized support'}
            </p>
          </div>

          {requestSuccess && (
            <div className="alert alert-success mb-4">
              ✓ {language === 'sw' 
                ? 'Ombi lako limefanikiwa! Mshauri atawasiliana nawe hivi karibuni.' 
                : 'Your request was successful! A counsellor will contact you soon.'}
            </div>
          )}

          {error && (
            <div className="alert alert-danger mb-4">
              ⚠️ {error}
            </div>
          )}

          {counsellors.length === 0 ? (
            <div className="card-custom text-center py-5">
              <p className="text-secondary">
                {language === 'sw' 
                  ? 'Hakuna washauri available kwa sasa. Tafadhali jaribu tena baadaye.' 
                  : 'No counsellors available at this time. Please try again later.'}
              </p>
              <button
                className="btn btn-outline-secondary mt-3"
                onClick={() => navigate('/resources')}
              >
                {language === 'sw' ? 'Rudi kwa Rasilimali' : 'Back to Resources'}
              </button>
            </div>
          ) : (
            <div className="resources-list">
              {counsellors.map((counsellor) => (
                <div key={counsellor.id} className="resource-item">
                  <div className="resource-content">
                    <div className="resource-header">
                      <h5 className="resource-name">{counsellor.name}</h5>
                      {counsellor.is_available && (
                        <span className="capacity-badge available">
                          {language === 'sw' ? 'Available' : 'Available'}
                        </span>
                      )}
                    </div>
                    <div className="resource-details">
                      {counsellor.email && (
                        <span className="resource-detail">
                          <strong>Email:</strong> {counsellor.email}
                        </span>
                      )}
                      {counsellor.phone && (
                        <span className="resource-detail">
                          <strong>Phone:</strong>{' '}
                          <a href={`tel:${counsellor.phone}`}>{counsellor.phone}</a>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="resource-actions">
                    {counsellor.is_available && (
                      <button
                        className="btn-call"
                        onClick={() => setSelectedCounsellor(counsellor)}
                        disabled={requesting}
                      >
                        {requesting ? 'Requesting...' : (language === 'sw' ? 'Omba Mshauri' : 'Request Counsellor')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="d-grid mt-4">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => navigate('/resources')}
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--color-text-secondary)'
              }}
            >
              ← Back to Resources
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedCounsellor && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ backgroundColor: '#1a1a1a', border: '1px solid var(--color-admin-border)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--color-admin-border)' }}>
                <h5 className="modal-title" style={{ color: 'var(--color-text)' }}>
                  Confirm Request
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedCounsellor(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {language === 'sw' 
                    ? `Je, unataka kumomba mshauri ${selectedCounsellor.name}? Watawasiliana nawe hivi karibuni.`
                    : `Are you sure you want to request counsellor ${selectedCounsellor.name}? They will contact you soon.`}
                </p>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--color-admin-border)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedCounsellor(null)}
                  disabled={requesting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleRequestCounsellor(selectedCounsellor.id)}
                  disabled={requesting}
                >
                  {requesting ? 'Requesting...' : (language === 'sw' ? 'Thibitisha Ombi' : 'Confirm Request')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Counsellors
