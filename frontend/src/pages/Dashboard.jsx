import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import { meetingService } from '../services/meetingService'
import { formatDuration, formatMeetingDate } from '../utils/format'
import {
  Search, Bell, ChevronRight,
  Video, Clock, CheckSquare, FileDown,
  Download, Eye, Trash2,
  Mic, Loader2,
} from 'lucide-react'

function StatusBadge({ status }) {
  if (status === 'processed')
    return <span className="badge badge-green">✓ Processed</span>
  if (status === 'processing')
    return <span className="badge badge-yellow">⏳ Processing…</span>
  return <span className="badge badge-muted">{status}</span>
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [meetings, setMeetings] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)

  async function loadDashboard() {
    setLoading(true)
    setError('')
    try {
      const [meetingsData, statsData] = await Promise.all([
        meetingService.list(),
        meetingService.stats(),
      ])
      setMeetings(meetingsData)
      setStats(statsData)
    } catch (err) {
      setError('Could not load your dashboard. Please try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  async function handleDelete(id) {
    try {
      await meetingService.remove(id)
      setMeetings((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      setError('Could not delete that meeting.')
    }
  }

  async function handleDownload(m) {
    setDownloadingId(m.id)
    setError('')
    try {
      await meetingService.downloadPdf(m.id, `${m.title}.pdf`)
      setMeetings((prev) => prev.map((x) => (x.id === m.id ? { ...x, has_pdf: true } : x)))
    } catch {
      setError('Could not generate the PDF. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  const STATS = stats
    ? [
      { label: 'Total meetings', value: String(stats.total_meetings), trend: `+${stats.meetings_this_week} this week`, icon: Video },
      { label: 'Hours recorded', value: `${stats.hours_recorded}h`, trend: `+${stats.hours_this_week}h`, icon: Clock },
      { label: 'Action items', value: String(stats.action_items), trend: `${stats.open_action_items} open`, icon: CheckSquare },
      { label: 'PDF reports', value: String(stats.pdf_reports), trend: `${stats.pdfs_this_week} this week`, icon: FileDown },
    ]
    : []

  const firstName = user?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        {/* Top bar */}
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <nav className="breadcrumb">
              <span>Home</span>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span className="breadcrumb-current">Dashboard</span>
            </nav>
          </div>
          <div className="dash-topbar-right">
            <div className="search-input-wrap">
              <Search size={14} className="search-input-icon" />
              <input placeholder="Search meetings…" />
            </div>
            <button className="btn-icon notif-btn">
              <Bell size={17} />
              <span className="notif-dot" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="dash-content">
          <div className="page-head">
            <div>
              <h1>Hello, {firstName} 👋</h1>
              <p>Here's what happened across your meetings this week.</p>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)',
              color: 'var(--red)', borderRadius: 8, padding: '10px 14px',
              fontSize: '0.875rem', marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
              Loading your dashboard…
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="stats-row">
                {STATS.map(({ label, value, trend, icon: Icon }) => (
                  <div key={label} className="stat-card">
                    <div className="stat-card-top">
                      <div className="stat-card-icon"><Icon size={18} /></div>
                      <span className="stat-trend">↑ {trend}</span>
                    </div>
                    <div>
                      <p className="stat-value">{value}</p>
                      <p className="stat-label">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Meetings list */}
              <section className="meetings-section">
                <div className="meetings-header">
                  <h2>Recent meetings</h2>
                  <div className="meetings-filters">
                    <button className="btn btn-ghost btn-sm">All</button>
                    <button className="btn btn-ghost btn-sm">Processed</button>
                    <button className="btn btn-ghost btn-sm">This week</button>
                  </div>
                </div>

                <div className="meetings-table-wrap">
                  {meetings.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><Mic size={28} /></div>
                      <h3>No meetings yet</h3>
                      <p>Upload your first recording and Clario will take it from there.</p>
                      <Link to="/new-meeting" className="btn btn-primary">
                        Start your first meeting
                      </Link>
                    </div>
                  ) : (
                    <table className="meetings-table">
                      <thead>
                        <tr>
                          <th>Meeting</th>
                          <th>Date</th>
                          <th>Duration</th>
                          <th>Status</th>
                          <th>Actions</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {meetings.map((m) => (
                          <tr key={m.id}>
                            <td>
                              <div className="meeting-title-cell">
                                <div className="meeting-icon"><Video size={16} /></div>
                                <div>
                                  <p className="meeting-name">{m.title}</p>
                                  <p className="meeting-meta">{m.participant_count} participants</p>
                                </div>
                              </div>
                            </td>
                            <td className="td-date">{formatMeetingDate(m.meeting_date)}</td>
                            <td className="td-duration">{formatDuration(m.duration_seconds)}</td>
                            <td><StatusBadge status={m.status} /></td>
                            <td className="td-actions-count">
                              {m.action_item_count > 0 ? (
                                <span style={{ color: 'var(--accent-dark)' }}>
                                  {m.action_item_count} items
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-3)' }}>—</span>
                              )}
                            </td>
                            <td>
                              <div className="td-row-actions">
                                <button
                                  className="btn-icon"
                                  title="Open"
                                  onClick={() => navigate(`/new-meeting/${m.id}`)}
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  className="btn-icon"
                                  title="Download PDF"
                                  disabled={m.status !== 'processed' || downloadingId === m.id}
                                  onClick={() => handleDownload(m)}
                                >
                                  {downloadingId === m.id
                                    ? <Loader2 size={15} className="spin" />
                                    : <Download size={15} />}
                                </button>
                                <button className="btn-icon" title="Delete" onClick={() => handleDelete(m.id)}>
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

             
              </section>
            </>
          )}
        </main>
      </div>

    </div>
  )
}