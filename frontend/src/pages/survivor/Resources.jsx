import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

// Sample resources data (will come from backend)
const sampleResources = {
  hotlines: [
    { name: 'GBV Recovery Centre', phone: '0800 123 4567', available: '24/7' },
    { name: 'Childline Kenya', phone: '116', available: '24/7' },
    { name: 'Women of Success', phone: '0700 123 456', available: '8am - 8pm' },
  ],
  shelters: [
    { name: 'Safe Haven Shelter', location: 'Nairobi', capacity: 'Available' },
    { name: 'Hope House', location: 'Mombasa', capacity: 'Limited' },
    { name: 'New Beginnings', location: 'Kisumu', capacity: 'Available' },
  ],
  organizations: [
    { name: 'Kenya Women\'s Trust', services: 'Legal aid, Counseling', location: 'Nairobi' },
    { name: 'COVAW', services: 'Support groups, Advocacy', location: 'Nationwide' },
    { name: 'Wangu Kanja Foundation', services: 'Medical, Legal support', location: 'Nairobi' },
  ],
  police: [
    { name: 'Gender Desk - Nairobi HQ', phone: '020 2222222', location: 'City Center' },
    { name: 'Police Emergency', phone: '999', location: 'Nationwide' },
  ]
}

function Resources() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('hotlines')
  const [locationFilter, setLocationFilter] = useState('all')

  const tabs = [
    { id: 'hotlines', label: t('resources.hotlines') || 'Hotlines', icon: '📞' },
    { id: 'shelters', label: t('resources.shelters') || 'Shelters', icon: '🏠' },
    { id: 'organizations', label: t('resources.organizations') || 'Organizations', icon: '🏢' },
    { id: 'police', label: t('resources.police') || 'Police', icon: '👮' },
  ]

  const renderContent = () => {
    const resources = sampleResources[activeTab] || []
    
    return (
      <div className="row g-3">
        {resources.map((resource, index) => (
          <div key={index} className="col-12">
            <div 
              className="p-3" 
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.05)', 
                borderRadius: '8px',
                border: '1px solid var(--color-primary-border)'
              }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="mb-1" style={{ color: 'var(--color-primary-light)' }}>
                    {resource.name}
                  </h6>
                  {resource.phone && (
                    <p className="mb-1 text-muted">
                      <a 
                        href={`tel:${resource.phone}`}
                        style={{ color: 'var(--color-primary-border)', textDecoration: 'none' }}
                      >
                        📞 {resource.phone}
                      </a>
                    </p>
                  )}
                  {resource.location && (
                    <p className="mb-1 text-muted">📍 {resource.location}</p>
                  )}
                  {resource.services && (
                    <p className="mb-1 text-muted">🔧 {resource.services}</p>
                  )}
                  {resource.available && (
                    <p className="mb-0 text-muted">⏰ {resource.available}</p>
                  )}
                  {resource.capacity && (
                    <span className={`badge ${
                      resource.capacity === 'Available' ? 'bg-success' : 'bg-warning'
                    }`}>
                      {resource.capacity}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card-custom">
            <h3 className="mb-4 text-center" style={{ color: 'var(--color-primary-light)' }}>
              {t('resources.title') || 'Local Resources'}
            </h3>

            {/* Location Filter */}
            <div className="mb-4">
              <label className="form-label text-muted">Filter by Location</label>
              <select
                className="form-select"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--color-primary-border)',
                  color: 'var(--color-text)'
                }}
              >
                <option value="all">All Locations</option>
                <option value="nairobi">Nairobi</option>
                <option value="mombasa">Mombasa</option>
                <option value="kisumu">Kisumu</option>
              </select>
            </div>

            {/* Tabs */}
            <ul className="nav nav-pills mb-4 nav-fill">
              {tabs.map((tab) => (
                <li key={tab.id} className="nav-item">
                  <button
                    className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      backgroundColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                      border: 'none',
                      margin: '0 2px',
                      fontSize: '0.875rem'
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Content */}
            <div className="mb-4">
              {renderContent()}
            </div>

            <div className="d-grid gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate('/results')}
                style={{ 
                  borderColor: 'var(--color-primary-border)',
                  color: 'var(--color-primary-light)'
                }}
              >
                ← Back to Results
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Resources
