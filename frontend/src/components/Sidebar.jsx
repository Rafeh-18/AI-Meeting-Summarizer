import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Video, FileText, BarChart2,
  Settings, LogOut, Mic, MessageSquare, Download,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard',    badge: null },
      { to: '/meetings',      icon: Video,           label: 'Meetings',     badge: null },
      { to: '/transcripts',   icon: FileText,        label: 'Transcripts',  badge: null },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/chat',          icon: MessageSquare,   label: 'AI Chat',      badge: null },
      { to: '/reports',       icon: Download,        label: 'Reports',      badge: null },
      { to: '/analytics',     icon: BarChart2,       label: 'Analytics',    badge: null },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/settings',      icon: Settings,        label: 'Settings',     badge: null },
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
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
    } finally {
      navigate('/login')
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
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{getInitials(user?.full_name)}</div>
          <div className="user-info">
            <p className="user-name">{user?.full_name || 'Loading…'}</p>
            <p className="user-email">{user?.email || ''}</p>
          </div>
          <button
            className="btn-icon"
            style={{ marginLeft: 'auto' }}
            title="Sign out"
            onClick={handleLogout}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}