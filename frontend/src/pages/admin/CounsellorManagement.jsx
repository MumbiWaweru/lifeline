import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { counsellorsApi } from '../../services/api'
import { STORAGE_KEYS } from '../../config'

function AdminCounsellors() {
  const navigate = useNavigate()
  const [counsellors, setCounsellors] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCounsellor, setNewCounsellor] = useState({
    name: '',
    email: '',
    phone: '',
    is_available: true,
  })

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
      
      if (!token) {
        navigate('/admin/login')
        return
      }

      try {
        setLoading(true)
        const [counsellorsData, requestsData] = await Promise.all([
          counsellorsApi.getAllCounsellors(token),
          counsellorsApi.getAllRequests(token),
        ])
        setCounsellors(counsellorsData)
        setRequests(requestsData)
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setError('Failed to load counsellor data')
        
        if (err.message.includes('401')) {
          localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
          navigate('/admin/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const handleAddCounsellor = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)

    try {
      const created = await counsellorsApi.createCounsellor(token, newCounsellor)
      setCounsellors([created, ...counsellors])
      setNewCounsellor({ name: '', email: '', phone: '', is_available: true })
      setShowAddForm(false)
    } catch (err) {
      console.error('Failed to create counsellor:', err)
      setError('Failed to create counsellor')
    }
  }

  const handleDeleteCounsellor = async (counsellorId) => {
    if (!window.confirm('Are you sure you want to delete this counsellor?')) {
      return
    }

    const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)

    try {
      await counsellorsApi.deleteCounsellor(token, counsellorId)
      setCounsellors(counsellors.filter(c => c.id !== counsellorId))
    } catch (err) {
      console.error('Failed to delete counsellor:', err)
      setError('Failed to delete counsellor')
    }
  }

  const handleUpdateRequestStatus = async (requestId, status) => {
    const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)

    try {
      await counsellorsApi.updateRequestStatus(token, requestId, status)
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status } : req
      ))
    } catch (err) {
      console.error('Failed to update request:', err)
      setError('Failed to update request status')
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="row mb-4">
        <div className="col-md-8">
          <h2 style={{ color: 'var(--color-admin-light)' }}>
            Manage Counsellors
          </h2>
          <p className="text-muted">Add, remove, and manage counsellor requests</p>
        </div>
        <div className="col-md-4 text-end">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate('/admin/dashboard')}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {/* Add Counsellor Button */}
      <div className="row mb-4">
        <div className="col-12">
          <button
            className="btn-primary-custom"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add New Counsellor'}
          </button>
        </div>
      </div>

      {/* Add Counsellor Form */}
      {showAddForm && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card-custom card-admin">
              <h4 className="mb-3" style={{ color: 'var(--color-text)' }}>Add New Counsellor</h4>
              <form onSubmit={handleAddCounsellor}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newCounsellor.name}
                      onChange={(e) => setNewCounsellor({ ...newCounsellor, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={newCounsellor.email}
                      onChange={(e) => setNewCounsellor({ ...newCounsellor, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={newCounsellor.phone}
                      onChange={(e) => setNewCounsellor({ ...newCounsellor, phone: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Available</label>
                    <select
                      className="form-select"
                      value={newCounsellor.is_available}
                      onChange={(e) => setNewCounsellor({ ...newCounsellor, is_available: e.target.value === 'true' })}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn-primary-custom mt-3">
                  Create Counsellor
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Counsellors List */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card-custom card-admin">
            <h4 className="mb-3" style={{ color: 'var(--color-text)' }}>
              All Counsellors ({counsellors.length})
            </h4>
            {counsellors.length === 0 ? (
              <p className="text-muted">No counsellors found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Available</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counsellors.map((c) => (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td>{c.email}</td>
                        <td>{c.phone || '-'}</td>
                        <td>
                          <span className={`badge ${c.is_available ? 'bg-success' : 'bg-secondary'}`}>
                            {c.is_available ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteCounsellor(c.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="row">
        <div className="col-12">
          <div className="card-custom card-admin">
            <h4 className="mb-3" style={{ color: 'var(--color-text)' }}>
              Counsellor Requests ({requests.length})
            </h4>
            {requests.length === 0 ? (
              <p className="text-muted">No requests at this time.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover">
                  <thead>
                    <tr>
                      <th>Session ID</th>
                      <th>Counsellor</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id}>
                        <td><small>{req.session_id}</small></td>
                        <td>{req.counsellor?.name || 'Unknown'}</td>
                        <td>
                          <span className={`badge ${
                            req.status === 'assigned' ? 'bg-success' :
                            req.status === 'resolved' ? 'bg-info' :
                            'bg-warning'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td><small>{new Date(req.created_at).toLocaleString()}</small></td>
                        <td>
                          {req.status === 'pending' && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleUpdateRequestStatus(req.id, 'assigned')}
                            >
                              Assign
                            </button>
                          )}
                          {req.status === 'assigned' && (
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleUpdateRequestStatus(req.id, 'resolved')}
                            >
                              Mark Resolved
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminCounsellors
