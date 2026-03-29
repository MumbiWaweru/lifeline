import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { resourcesApi } from '../../services/api'

const sampleResources = {
  hotlines: [
    { name: 'GBV Recovery Centre', phone: '0800 123 4567', available: '24/7', description: 'Free confidential support hotline' },
    { name: 'Childline Kenya', phone: '116', available: '24/7', description: 'Support for children and young people' },
    { name: 'Women of Success', phone: '0700 123 456', available: '8am - 8pm', description: 'Counseling and support services' },
  ],
  shelters: [
    { name: 'Safe Haven Shelter', location: 'Nairobi', capacity: 'Available', description: 'Emergency accommodation and support' },
    { name: 'Hope House', location: 'Mombasa', capacity: 'Limited', description: 'Temporary housing for survivors' },
    { name: 'New Beginnings', location: 'Kisumu', capacity: 'Available', description: 'Safe shelter with counseling services' },
  ],
  organizations: [
    { name: 'Kenya Women\'s Trust', services: 'Legal aid, Counseling', location: 'Nairobi', description: 'Comprehensive support services' },
    { name: 'COVAW', services: 'Support groups, Advocacy', location: 'Nationwide', description: 'Community-based support programs' },
    { name: 'Wangu Kanja Foundation', services: 'Medical, Legal support', location: 'Nairobi', description: 'Survivor empowerment programs' },
  ],
  police: [
    { name: 'Gender Desk - Nairobi HQ', phone: '020 2222222', location: 'City Center', description: 'Specialized GBV response unit' },
    { name: 'Police Emergency', phone: '999', location: 'Nationwide', description: '24/7 emergency response' },
  ]
}

function Resources() {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const [activeTab, setActiveTab] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [apiResources, setApiResources] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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
    { id: 'all', label: 'All Resources' },
    { id: 'hotlines', label: 'Hotlines' },
    { id: 'shelters', label: 'Shelters' },
    { id: 'organizations', label: 'Organizations' },
    { id: 'police', label: 'Police' },
  ]

  const getAllResources = () => {
    const apiMapped = apiResources.length > 0 ? groupResourcesByType(apiResources) : null
    
    if (apiMapped) {
      if (activeTab === 'all') {
        return Object.values(apiMapped).flat()
      }
      return apiMapped[activeTab] || []
    }

    if (activeTab === 'all') {
      return Object.values(sampleResources).flat()
    }
    return sampleResources[activeTab] || []
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
        description: resource.type,
      })
    })
    
    return grouped
  }

  const filterResources = (resources) => {
    let filtered = resources
    
    if (locationFilter !== 'all') {
      filtered = filtered.filter(r => 
        r.location && r.location.toLowerCase().includes(locationFilter.toLowerCase())
      )
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
      )
    }
    
    return filtered
  }

  const resources = filterResources(getAllResources())

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8">
          <div className="resources-page-header mb-4">
            <h2 className="text-gradient mb-2">Support Resources</h2>
            <p className="text-secondary">Find local organizations, hotlines, and services ready to help</p>
          </div>

          <div className="card-custom mb-4">
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label">Location</label>
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
              <div className="col-md-6">
                <label className="form-label">Search</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ul className="nav nav-pills mb-4 nav-fill resource-tabs">
              {tabs.map((tab) => (
                <li key={tab.id} className="nav-item">
                  <button
                    className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status"></div>
                <p className="mt-3 text-secondary">Loading resources...</p>
              </div>
            ) : (
              <div className="resources-list">
                {resources.length > 0 ? (
                  resources.map((resource, index) => (
                    <div key={index} className="resource-item">
                      <div className="resource-content">
                        <div className="resource-header">
                          <h5 className="resource-name">{resource.name}</h5>
                          {resource.capacity && (
                            <span className={`capacity-badge ${resource.capacity === 'Available' ? 'available' : 'limited'}`}>
                              {resource.capacity}
                            </span>
                          )}
                        </div>
                        {resource.description && (
                          <p className="resource-description">{resource.description}</p>
                        )}
                        <div className="resource-details">
                          {resource.phone && (
                            <span className="resource-detail">
                              <strong>Phone:</strong> <a href={`tel:${resource.phone}`}>{resource.phone}</a>
                            </span>
                          )}
                          {resource.location && (
                            <span className="resource-detail">
                              <strong>Location:</strong> {resource.location}
                            </span>
                          )}
                          {resource.services && (
                            <span className="resource-detail">
                              <strong>Services:</strong> {resource.services}
                            </span>
                          )}
                          {resource.available && (
                            <span className="resource-detail">
                              <strong>Hours:</strong> {resource.available}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="resource-actions">
                        {resource.phone && (
                          <a href={`tel:${resource.phone}`} className="btn-call">
                            Call Now
                          </a>
                        )}
                        <button 
                          className="btn-details"
                          onClick={() => navigate(`/resources/${index}`)}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5">
                    <p className="text-secondary">No resources found matching your criteria.</p>
                  </div>
                )}
              </div>
            )}
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
              Back to Results
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Resources
