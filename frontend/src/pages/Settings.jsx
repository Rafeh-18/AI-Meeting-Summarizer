import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import { ChevronRight, User, Lock, Save } from 'lucide-react'

export default function Settings() {
  const { user, updateProfile } = useAuth()

  const [profileForm, setProfileForm] = useState({ full_name: '', email: '' })
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    if (user) setProfileForm({ full_name: user.full_name, email: user.email })
  }, [user])

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setSavingProfile(true)
    try {
      await updateProfile(profileForm)
      setProfileSuccess('Profile updated.')
    } catch (err) {
      setProfileError(Object.values(err.response?.data?.errors || {})[0] || 'Could not update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')
    setSavingPw(true)
    try {
      await authService.changePassword(pwForm)
      setPwSuccess('Password changed.')
      setPwForm({ current_password: '', new_password: '' })
    } catch (err) {
      setPwError(Object.values(err.response?.data?.errors || {})[0] || 'Could not change password.')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <nav className="breadcrumb">
              <span>Home</span>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span className="breadcrumb-current">Settings</span>
            </nav>
          </div>
        </header>

        <main className="dash-content" style={{ maxWidth: 560 }}>
          <div className="page-head">
            <div>
              <h1>Settings</h1>
              <p>Manage your profile and account security.</p>
            </div>
          </div>

          {/* Profile section */}
          <section className="stat-card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <User size={16} />
              <h2 style={{ fontSize: '1rem', margin: 0 }}>Profile</h2>
            </div>

            {profileError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 8, padding: '10px 14px', fontSize: '0.875rem', marginBottom: 16 }}>
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', borderRadius: 8, padding: '10px 14px', fontSize: '0.875rem', marginBottom: 16 }}>
                {profileSuccess}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Full name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={savingProfile}>
                <Save size={14} /> {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </section>

          {/* Password section */}
          <section className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Lock size={16} />
              <h2 style={{ fontSize: '1rem', margin: 0 }}>Password</h2>
            </div>

            {pwError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 8, padding: '10px 14px', fontSize: '0.875rem', marginBottom: 16 }}>
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', borderRadius: 8, padding: '10px 14px', fontSize: '0.875rem', marginBottom: 16 }}>
                {pwSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Current password</label>
                <input
                  type="password"
                  className="form-input"
                  value={pwForm.current_password}
                  onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">New password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min. 8 characters, 1 number, 1 symbol"
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={savingPw}>
                {savingPw ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </section>
        </main>
      </div>
    </div>
  )
}