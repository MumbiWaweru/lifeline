import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

function AdminLogin() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    
    // Simple password check (replace with actual auth from backend)
    if (password === 'admin123') {
      // Store auth token
      localStorage.setItem('adminAuth', 'true')
      navigate('/admin/dashboard')
    } else {
      setError('Invalid password')
    }
  }

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-6 col-lg-4">
          <div className="card-custom card-admin">
            <div className="text-center mb-4">
              <span style={{ fontSize: '3rem' }}>🔐</span>
            </div>
            
            <h2 className="text-center mb-4" style={{ color: 'var(--color-admin-light)' }}>
              Admin Access
            </h2>

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label text-muted">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--color-admin-border)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="d-grid gap-2">
                <button
                  type="submit"
                  className="btn btn-primary-custom"
                  style={{
                    backgroundColor: 'var(--color-admin)',
                    borderColor: 'var(--color-admin-border)'
                  }}
                >
                  Login
                </button>
                
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => navigate('/')}
                  style={{ 
                    borderColor: 'var(--color-admin-border)',
                    color: 'var(--color-admin-light)'
                  }}
                >
                  ← Back to Home
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <small className="text-muted">
                Authorized personnel only. All access is logged.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
