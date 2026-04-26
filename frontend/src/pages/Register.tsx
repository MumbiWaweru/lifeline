// pages/Register.tsx
// FR-001: User registration with email verification + anonymous survivor profiles
// FR-002: Role selection (Survivor / Counselor)
// FR-010: TOTP MFA setup prompt after registration

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../api'

type Role = 'survivor' | 'counselor'

interface RegisterPayload {
  email?: string
  password: string
  role: Role
  display_name?: string
  language: string
  is_anonymous: boolean
}

export default function Register() {
  const navigate = useNavigate()

  const [role, setRole]           = useState<Role>('survivor')
  const [anonymous, setAnonymous] = useState(false)
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [displayName, setName]    = useState('')
  const [language, setLanguage]   = useState('en')
  const [step, setStep]           = useState<'form' | 'verify' | 'done'>('form')

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) =>
      apiClient.post('/auth/register', payload).then(r => r.data),
    onSuccess: (data) => {
      if (data.access_token) {
        // Anonymous survivor — logged in immediately
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('role', data.role)
        navigate('/assess')
      } else {
        setStep('verify')
      }
    },
  })

  const handleSubmit = () => {
    const payload: RegisterPayload = {
      password,
      role,
      language,
      is_anonymous: anonymous,
      ...(anonymous ? {} : { email, display_name: displayName }),
    }
    registerMutation.mutate(payload)
  }

  if (step === 'verify') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-icon">📧</div>
          <h2>Check your email</h2>
          <p>
            We've sent a verification link to <strong>{email}</strong>.
            Click the link to activate your account, then{' '}
            <Link to="/login">sign in</Link>.
          </p>
          <p className="auth-note">
            Didn't receive it? Check your spam folder or{' '}
            <button className="link-btn" onClick={() => setStep('form')}>
              re-register
            </button>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-icon">🛡️</div>
        <h1>Get Support — Safely</h1>
        <p className="auth-subtitle">
          LIFELINE keeps your identity private. You are in control.
        </p>

        {/* Role selector */}
        <div className="role-tabs" role="tablist">
          {(['survivor', 'counselor'] as Role[]).map(r => (
            <button
              key={r}
              role="tab"
              aria-selected={role === r}
              className={`role-tab ${role === r ? 'active' : ''}`}
              onClick={() => { setRole(r); if (r === 'counselor') setAnonymous(false) }}
            >
              {r === 'survivor' ? '🙋 I need support' : '💼 I am a counselor'}
            </button>
          ))}
        </div>

        {/* Anonymous toggle — survivors only */}
        {role === 'survivor' && (
          <label className="anon-toggle">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={e => setAnonymous(e.target.checked)}
            />
            <span>
              <strong>Stay anonymous</strong> — no email, no trace.
              Your password is the only key to your account.
            </span>
          </label>
        )}

        {/* Fields */}
        {!anonymous && (
          <>
            <label className="field-label">
              Email address
              {role === 'counselor' && <span className="req">*</span>}
            </label>
            <input
              className="field-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </>
        )}

        <label className="field-label">
          {anonymous ? 'Create a secure passphrase' : 'Password'}
          <span className="req">*</span>
        </label>
        <input
          className="field-input"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        {!anonymous && (
          <>
            <label className="field-label">Display name (optional)</label>
            <input
              className="field-input"
              type="text"
              placeholder="How should we address you?"
              value={displayName}
              onChange={e => setName(e.target.value)}
            />
          </>
        )}

        <label className="field-label">Language</label>
        <select
          className="field-input"
          value={language}
          onChange={e => setLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="sw">Swahili</option>
        </select>

        {registerMutation.isError && (
          <p className="error-msg">
            {(registerMutation.error as any)?.response?.data?.detail ?? 'Registration failed. Please try again.'}
          </p>
        )}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={registerMutation.isPending || !password || (!anonymous && !email)}
        >
          {registerMutation.isPending ? 'Creating account…' : 'Create account'}
        </button>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <p className="privacy-note">
          🔒 All data is encrypted. Your location is never stored.
          Hit the <strong>Quick Exit</strong> button at any time to leave instantly.
        </p>
      </div>
    </div>
  )
}