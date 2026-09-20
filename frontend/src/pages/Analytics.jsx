import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { meetingService } from '../services/meetingService'
import { ChevronRight, BarChart2 } from 'lucide-react'

const TRACK_HEIGHT = 120 // px — the actual drawable bar area

function WeeklyBarChart({ weekly, metricKey, color, unit }) {
  const max = Math.max(1, ...weekly.map((w) => w[metricKey]))

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, padding: '16px 0' }}>
      {weekly.map((w) => {
        const value = w[metricKey]
        // Real pixel height, not a percentage — percentages need a parent
        // with an explicit height to resolve against, which this didn't have.
        const barHeight = Math.max((value / max) * TRACK_HEIGHT, 4)
        return (
          <div key={w.week_label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
              {value}{unit}
            </div>
            <div style={{
              width: '100%',
              height: TRACK_HEIGHT,
              display: 'flex',
              alignItems: 'flex-end',
            }}>
              <div style={{
                width: '100%',
                height: barHeight,
                background: color,
                borderRadius: 4,
                transition: 'height 0.3s ease',
              }} />
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-3)' }}>{w.week_label}</div>
          </div>
        )
      })}
    </div>
  )
}

function StatusBar({ breakdown }) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1
  const segments = [
    { key: 'processed', label: 'Processed', color: '#4ade80' },
    { key: 'processing', label: 'Processing', color: '#facc15' },
    { key: 'uploaded', label: 'Uploaded (not yet processed)', color: 'var(--accent, #FF6B6B)' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
        {segments.map((s) => (
          <div
            key={s.key}
            style={{ width: `${(breakdown[s.key] / total) * 100}%`, background: s.color }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map((s) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-2)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
            {s.label} — {breakdown[s.key]}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    meetingService
      .analytics()
      .then(setData)
      .catch(() => setError('Could not load analytics. Please try refreshing.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <nav className="breadcrumb">
              <span>Home</span>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span className="breadcrumb-current">Analytics</span>
            </nav>
          </div>
        </header>

        <main className="dash-content">
          <div className="page-head">
            <div>
              <h1>Analytics</h1>
              <p>Trends across all your meetings, last 8 weeks.</p>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)', color: 'var(--red)', borderRadius: 8, padding: '10px 14px', fontSize: '0.875rem', marginBottom: 16 }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
              Loading analytics…
            </div>
          ) : data.total_meetings === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><BarChart2 size={28} /></div>
              <h3>No data yet</h3>
              <p>Upload a few meetings and your trends will show up here.</p>
            </div>
          ) : (
            <>
              <div className="stats-row" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                  <p className="stat-value">{data.total_meetings}</p>
                  <p className="stat-label">Total meetings</p>
                </div>
                <div className="stat-card">
                  <p className="stat-value">{data.avg_duration_minutes}m</p>
                  <p className="stat-label">Avg. duration</p>
                </div>
                <div className="stat-card">
                  <p className="stat-value">{data.total_action_items}</p>
                  <p className="stat-label">Total action items</p>
                </div>
              </div>

              <div className="stat-card" style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: '1rem', marginBottom: 8 }}>Meetings per week</h2>
                <WeeklyBarChart weekly={data.weekly} metricKey="meetings_count" color="var(--accent, #FF6B6B)" unit="" />
              </div>

              <div className="stat-card" style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: '1rem', marginBottom: 8 }}>Hours recorded per week</h2>
                <WeeklyBarChart weekly={data.weekly} metricKey="hours" color="#4ade80" unit="h" />
              </div>

              <div className="stat-card">
                <h2 style={{ fontSize: '1rem', marginBottom: 8 }}>Status breakdown</h2>
                <StatusBar breakdown={data.status_breakdown} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}