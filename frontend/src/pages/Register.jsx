import { Link, useNavigate } from 'react-router-dom'
import { Mic, User, Mail, Lock, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const PERKS = [
  'Unlimited recordings',
  'AI-powered summaries',
  'PDF report export',
  'Full transcript search',
]

export default function Register() {
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy.')
      return
    }

    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      const msg =
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
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <span className="auth-logo-icon">
            <Mic size={18} color="#fff" />
          </span>
          Clario
        </div>
        <div className="auth-heading">
          <h1>Create your account</h1>
          <p>Start summarising meetings in minutes</p>
        </div>

        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px 24px',
          marginBottom: 24, justifyContent: 'center',
        }}>
          {PERKS.map((p) => (
            <span key={p} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.8125rem', color: 'var(--text-2)',
            }}>
              <CheckCircle size={13} color="var(--green)" />
              {p}
            </span>
          ))}
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
            <label className="form-label">Full name</label>
            <div className="form-input-icon-wrap">
              <User size={15} className="form-input-icon" />
              <input
                type="text"
                name="full_name"
                className="form-input"
                placeholder="Enter your name"
                autoComplete="name"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Work email</label>
            <div className="form-input-icon-wrap">
              <Mail size={15} className="form-input-icon" />
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="Enter your email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="form-input-icon-wrap" style={{ position: 'relative' }}>
              <Lock size={15} className="form-input-icon" />
              <input
                type={showPw ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
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
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>
              Use at least 8 characters, one number, and one symbol.
            </p>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: 15, height: 15, marginTop: 2 }}
            />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
              I agree to the{' '}
              <a href="#" style={{ color: 'var(--accent-bright)' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" style={{ color: 'var(--accent-bright)' }}>Privacy Policy</a>
            </span>
          </label>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : "Create account — it's free"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
