import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Sample resources (will come from backend)
const initialResources = [
  { id: 1, type: 'hotline', name: 'GBV Recovery Centre', contact: '0800 123 4567', location: 'Nairobi', status: 'active' },
  { id: 2, type: 'shelter', name: 'Safe Haven Shelter', contact: '0700 123 456', location: 'Mombasa', status: 'active' },
  { id: 3, type: 'organization', name: 'Kenya Women\'s Trust', contact: 'info@kwt.org', location: 'Nairobi', status: 'active' },
  { id: 4, type: 'police', name: 'Gender Desk - Nairobi', contact: '020 2222222', location: 'City Center', status: 'active' },
]

function ResourceManager() {
  const navigate = useNavigate()
  const [resources, setResources] = useState(initialResources)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [filter, setFilter] = useState('all')

  const [formData, setFormData] = useState({
    type: 'hotline',
    name: '',
    contact: '',
    location: '',
    status: 'active'
  })

  const handleAdd = () => {
    const newResource = {
      id: Date.now(),
      ...formData
    }
    setResources([...resources, newResource])
    setShowAddForm(false)
    setFormData({ type: 'hotline', name: '', contact: '', location: '', status: 'active' })
  }

  const handleEdit = (resource) => {
    setEditingResource(resource)
    setFormData({
      type: resource.type,
      name: resource.name,
      contact: resource.contact,
      location: resource.location,
      status: resource.status
    })
  }

  const handleUpdate = () => {
    setResources(resources.map(r => 
      r.id === editingResource.id ? { ...r, ...formData } : r
    ))
    setEditingResource(null)
    setFormData({ type: 'hotline', name: '', contact: '', location: '', status: 'active' })
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      setResources(resources.filter(r => r.id !== id))
    }
  }

  const filteredResources = filter === 'all' 
    ? resources 
    : resources.filter(r => r.type === filter)

  const getTypeBadge = (type) => {
    const badges = {
      hotline: 'bg-info',
      shelter: 'bg-success',
      organization: 'bg-primary',
      police: 'bg-danger'
    }
    return badges[type] || 'bg-secondary'
  }

  return (
    <div className="container">
      <div className="row mb-4">
        <div className="col-md-8">
          <h2 style={{ color: 'var(--color-admin-light)' }}>
            Resource Manager
          </h2>
          <p className="text-muted">Add, edit, and manage support resources</p>
        </div>
        <div className="col-md-4 text-end">
          <button
            className="btn btn-outline-secondary btn-sm me-2"
            onClick={() => navigate('/admin/dashboard')}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Add New Button & Filter */}
      <div className="row mb-4">
        <div className="col-md-6">
          <button
            className="btn btn-primary-custom"
            onClick={() => setShowAddForm(true)}
          >
            ➕ Add New Resource
          </button>
        </div>
        <div className="col-md-6">
          <select
            className="form-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--color-admin-border)',
              color: 'var(--color-text)'
            }}
          >
            <option value="all">All Types</option>
            <option value="hotline">Hotlines</option>
            <option value="shelter">Shelters</option>
            <option value="organization">Organizations</option>
            <option value="police">Police</option>
          </select>
        </div>
      </div>

      {/* Resources Table */}
      <div className="row">
        <div className="col-12">
          <div className="card-custom card-admin">
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResources.map((resource) => (
                    <tr key={resource.id}>
                      <td>
                        <span className={`badge ${getTypeBadge(resource.type)}`}>
                          {resource.type}
                        </span>
                      </td>
                      <td>{resource.name}</td>
                      <td>{resource.contact}</td>
                      <td>{resource.location}</td>
                      <td>
                        <span className={`badge ${resource.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                          {resource.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => handleEdit(resource)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(resource.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddForm || editingResource) && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content" style={{ backgroundColor: '#1a1a1a', border: '1px solid var(--color-admin-border)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--color-admin-border)' }}>
                <h5 className="modal-title" style={{ color: 'var(--color-admin-light)' }}>
                  {editingResource ? 'Edit Resource' : 'Add New Resource'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingResource(null)
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--color-admin-border)',
                      color: 'var(--color-text)'
                    }}
                  >
                    <option value="hotline">Hotline</option>
                    <option value="shelter">Shelter</option>
                    <option value="organization">Organization</option>
                    <option value="police">Police</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--color-admin-border)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--color-admin-border)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--color-admin-border)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--color-admin-border)',
                      color: 'var(--color-text)'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--color-admin-border)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingResource(null)
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={editingResource ? handleUpdate : handleAdd}
                >
                  {editingResource ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResourceManager
