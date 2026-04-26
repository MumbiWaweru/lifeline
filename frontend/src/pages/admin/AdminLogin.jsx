import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/api'
import { STORAGE_KEYS } from '../../config'

function AdminLogin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await adminApi.login(password)
      if (res.token) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, res.token)
        navigate('/admin/dashboard')
      } else {
        setError('Invalid password. Please try again.')
      }
    } catch {
      // Fallback for demo
      if (password === 'admin123') {
        localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, 'demo-admin-token')
        localStorage.setItem('adminAuth', 'true')
        navigate('/admin/dashboard')
      } else {
        setError('Invalid password. Default demo password: admin123')
      }
    }
    setLoading(false)
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="alc-header">
          <div className="alc-logo">L</div>
          <h1 className="alc-title">Lifeline Admin</h1>
          <p className="alc-sub">Authorized personnel only. All access is logged.</p>
        </div>

        <form onSubmit={handleLogin} className="alc-form">
          <div className="alc-field">
            <label>Admin Password</label>
            <input
              type="password"
              className="alc-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password..."
              autoFocus
            />
          </div>

          {error && <div className="alc-error">{error}</div>}

          <button type="submit" className="alc-submit" disabled={loading}>
            {loading ? <span className="loading-spinner-sm" /> : '→'} Sign In
          </button>
        </form>

        <button className="alc-back" onClick={() => navigate('/')}>
          ← Back to Lifeline
        </button>

        <div className="alc-note">
          🔒 This portal is for verified GBV support staff only.
        </div>
      </div>
    </div>
  )
}

export default AdminLogin