import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { resourcesApi } from '../../services/api'

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
  const { t, language } = useLanguage()
  const [activeTab, setActiveTab] = useState('hotlines')
  const [locationFilter, setLocationFilter] = useState('all')
  const [apiResources, setApiResources] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchResources = async () => {
      if (locationFilter === 'all') return
      
      setLoading(true)
      try {
        const response = await resourcesApi.getByLocation(locationFilter, language)
        setApiResources(response.resources || [])
      } catch (err) {
        console.error('Failed to fetch resources:', err)
        setApiResources([])
      }
      setLoading(false)
    }

    fetchResources()
  }, [locationFilter, language])

  const tabs = [
    { id: 'hotlines', label: 'Hotlines', icon: '📞' },
    { id: 'shelters', label: 'Shelters', icon: '🏠' },
    { id: 'organizations', label: 'Organizations', icon: '🏢' },
    { id: 'police', label: 'Police', icon: '👮' },
  ]

  const renderContent = () => {
    const resources = apiResources.length > 0 
      ? groupResourcesByType(apiResources)
      : sampleResources[activeTab] || []
    
    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" style={{ color: 'var(--color-primary)' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: 'var(--color-text-secondary)' }}>Loading resources...</p>
        </div>
      )
    }
    
    return (
      <div className="row g-3">
        {resources.map((resource, index) => (
          <div key={index} className="col-12">
            <div className="resource-card">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <h6 className="resource-name">
                    {resource.name}
                  </h6>
                  {resource.phone && (
                    <p className="resource-info">
                      <a 
                        href={`tel:${resource.phone}`}
                        className="resource-link"
                      >
                        📞 {resource.phone}
                      </a>
                    </p>
                  )}
                  {resource.location && (
                    <p className="resource-info">📍 {resource.location}</p>
                  )}
                  {resource.services && (
                    <p className="resource-info">🔧 {resource.services}</p>
                  )}
                  {resource.available && (
                    <p className="resource-info">⏰ {resource.available}</p>
                  )}
                  {resource.capacity && (
                    <span className={`badge ${
                      resource.capacity === 'Available' ? 'bg-success' : 'bg-warning'
                    }`}>
                      {resource.capacity}
                    </span>
                  )}
                </div>
                <a 
                  href={resource.phone ? `tel:${resource.phone}` : '#'}
                  className="btn btn-sm"
                  style={{
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    borderRadius: '8px'
                  }}
                >
                  Call →
                </a>
              </div>
            </div>
          </div>
        ))}
        {resources.length === 0 && !loading && (
          <div className="col-12 text-center py-5">
            <p style={{ color: 'var(--color-text-muted)' }}>
              No resources found for this location.
            </p>
          </div>
        )}
      </div>
    )
  }

  const groupResourcesByType = (resources) => {
    const typeMap = {
      hotline: 'hotlines',
      shelter: 'shelters',
      organization: 'organizations',
      legal: 'organizations',
      police: 'police',
    }
    
    const grouped = { hotlines: [], shelters: [], organizations: [], police: [] }
    
    resources.forEach(resource => {
      const tab = typeMap[resource.type] || 'organizations'
      grouped[tab].push({
        name: resource.name,
        phone: resource.number,
        location: resource.location,
      })
    })
    
    return grouped[activeTab] || []
  }

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card-custom">
            <h3 className="mb-4 text-gradient text-center">
              📍 {t('resources.title') || 'Local Resources'}
            </h3>

            <div className="mb-4">
              <label className="form-label">Filter by Location</label>
              <select
                className="form-select"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="all">All Locations</option>
                <option value="Nairobi">Nairobi</option>
                <option value="Mombasa">Mombasa</option>
                <option value="Kisumu">Kisumu</option>
              </select>
            </div>

            <ul className="nav nav-pills mb-4 nav-fill">
              {tabs.map((tab) => (
                <li key={tab.id} className="nav-item">
                  <button
                    className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon} {tab.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mb-4">
              {renderContent()}
            </div>

            <div className="d-grid">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate('/results')}
                style={{ 
                  borderColor: 'var(--border-color)',
                  color: 'var(--color-text-secondary)'
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
