import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  LayoutDashboard, BarChart2,
  Settings, LogOut, Mic,
  Plus, HelpCircle, CreditCard, ChevronsUpDown, Trash2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { meetingService } from '../services/meetingService'
import ConfirmDialog from './ConfirmDialog'

const NAV = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard',    badge: null },
      { to: '/analytics',     icon: BarChart2,       label: 'Analytics',    badge: null },
    ],
  },
]

function getInitials(fullName) {
  if (!fullName) return '?'
  const parts = fullName.trim().split(' ')
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export default function Sidebar() {
  const { pathname } = useLocation()
  const { id: activeMeetingId } = useParams()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const [meetings, setMeetings] = useState([])
  const [loadingMeetings, setLoadingMeetings] = useState(true)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  // Refetch on every navigation so a newly-created meeting (or a status
  // change from processing it) shows up without a manual page reload.
  useEffect(() => {
    meetingService
      .list()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.meeting_date) - new Date(a.meeting_date)
        )
        setMeetings(sorted)
      })
      .catch(() => {})
      .finally(() => setLoadingMeetings(false))
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  async function handleLogout() {
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  async function confirmDelete() {
    const id = pendingDeleteId
    setPendingDeleteId(null)
    try {
      await meetingService.remove(id)
      setMeetings((prev) => prev.filter((m) => m.id !== id))
      if (String(id) === activeMeetingId) navigate('/new-meeting')
    } catch {
      // silently ignore — the item stays in the list and the person can retry
    }
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <span className="sidebar-logo-icon">
          <Mic size={15} color="#fff" />
        </span>
        Clario
      </div>

      <div style={{ padding: '16px 12px 0' }}>
        <Link to="/new-meeting" className="btn btn-primary" style={{ width: '100%' }}>
          <Plus size={16} />
          New meeting
        </Link>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV.map((section) => (
          <div key={section.label}>
            <p className="nav-section-label">{section.label}</p>
            {section.items.map(({ to, icon: Icon, label, badge }) => (
              <Link
                key={to}
                to={to}
                className={`sidebar-link ${pathname === to ? 'active' : ''}`}
              >
                <Icon className="link-icon" size={16} />
                {label}
                {badge && <span className="link-badge">{badge}</span>}
              </Link>
            ))}
          </div>
        ))}

        <div>
          <p className="nav-section-label">Recents</p>
          {loadingMeetings ? (
            <p className="sidebar-meeting-empty">Loading…</p>
          ) : meetings.length === 0 ? (
            <p className="sidebar-meeting-empty">No meetings yet</p>
          ) : (
            meetings.map((m) => (
              <div
                key={m.id}
                className={`sidebar-meeting-item ${String(m.id) === activeMeetingId ? 'active' : ''}`}
                onClick={() => navigate(`/new-meeting/${m.id}`)}
              >
                <span className={`status-dot ${m.status}`} />
                <span className="sidebar-meeting-title">{m.title}</span>
                <button
                  className="sidebar-meeting-delete"
                  title="Delete"
                  onClick={(e) => { e.stopPropagation(); setPendingDeleteId(m.id) }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </nav>

      {/* User footer */}
      <div className="sidebar-footer" ref={menuRef}>
        {menuOpen && (
          <div className="user-menu">
            <Link to="/settings" className="user-menu-item">
              <Settings size={15} /> Settings
            </Link>
            <Link to="/billing" className="user-menu-item">
              <CreditCard size={15} /> Billing
            </Link>
            <Link to="/help" className="user-menu-item">
              <HelpCircle size={15} /> Help
            </Link>
            <div className="user-menu-divider" />
            <button className="user-menu-item danger" onClick={handleLogout}>
              <LogOut size={15} /> Log out
            </button>
          </div>
        )}

        <button className="user-chip" onClick={() => setMenuOpen((v) => !v)}>
          <div className="user-avatar">{getInitials(user?.full_name)}</div>
          <div className="user-info">
            <p className="user-name">{user?.full_name || 'Loading…'}</p>
            <p className="user-email">{user?.email || ''}</p>
          </div>
          <ChevronsUpDown size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
        </button>
      </div>

      {pendingDeleteId && (
        <ConfirmDialog
          title="Delete this meeting?"
          message="This will permanently delete the recording, transcript, and any generated report. This can't be undone."
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </aside>
  )
}