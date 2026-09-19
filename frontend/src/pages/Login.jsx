import { Link, useNavigate } from 'react-router-dom'
import { Mic, Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form)
      navigate('/dashboard')
    } catch (err) {
      const msg =
        err.response?.data?.errors?.general ||
        Object.values(err.response?.data?.errors || {})[0] ||
        'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Link to="/" className="btn btn-ghost btn-sm auth-back">
        <ArrowLeft size={14} /> Back
      </Link>
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">
            <Mic size={18} color="#fff" />
          </span>
          Clario
        </div>
        <div className="auth-heading">
          <h1>Welcome back</h1>
          <p>Sign in to access your meeting history</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171', borderRadius: 8, padding: '10px 14px',
            fontSize: '0.875rem', marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="form-input-icon-wrap">
              <Mail size={15} className="form-input-icon" />
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="you@company.com"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="form-label">Password</label>
              <a href="#" style={{ fontSize: '0.8125rem', color: 'var(--accent-bright)' }}>
                Forgot password?
              </a>
            </div>
            <div className="form-input-icon-wrap" style={{ position: 'relative' }}>
              <Lock size={15} className="form-input-icon" />
              <input
                type={showPw ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowPw((p) => !p)}
                style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>Keep me signed in</span>
          </label>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          No account yet?{' '}
          <Link to="/register">Create one free</Link>
        </p>
      </div>
    </div>
  )
}