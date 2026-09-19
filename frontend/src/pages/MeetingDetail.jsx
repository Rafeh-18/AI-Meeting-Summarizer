import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { meetingService } from '../services/meetingService'
import { formatDuration, formatMeetingDate } from '../utils/format'
import { ChevronRight, ArrowLeft, CheckSquare, AlertTriangle, Lightbulb, User } from 'lucide-react'

export default function MeetingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    meetingService
      .get(id)
      .then(setMeeting)
      .catch(() => setError('Could not load this meeting.'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <nav className="breadcrumb">
              <span>Home</span>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span onClick={() => navigate('/meetings')} style={{ cursor: 'pointer' }}>Meetings</span>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span className="breadcrumb-current">{meeting?.title || '...'}</span>
            </nav>
          </div>
        </header>

        <main className="dash-content">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/meetings')} style={{ marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to meetings
          </button>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 8, padding: '10px 14px', fontSize: '0.875rem', marginBottom: 16 }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>Loading…</div>
          ) : meeting ? (
            <>
              <div className="page-head">
                <div>
                  <h1>{meeting.title}</h1>
                  <p>{formatMeetingDate(meeting.meeting_date)} · {formatDuration(meeting.duration_seconds)}</p>
                </div>
              </div>

              {meeting.status !== 'processed' ? (
                <div className="empty-state">
                  <h3>{meeting.status === 'processing' ? 'Processing…' : 'Not processed yet'}</h3>
                  <p>
                    {meeting.status === 'processing'
                      ? 'Transcription and summarization are running. Refresh in a bit.'
                      : meeting.processing_error
                      ? `Last attempt failed: ${meeting.processing_error}`
                      : 'Go to the Meetings list and click the sparkle icon to process this meeting.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="stat-card">
                    <h2 style={{ fontSize: '1rem', marginBottom: 8 }}>Summary</h2>
                    <p style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>{meeting.summary_text}</p>
                  </div>

                  {meeting.key_points?.length > 0 && (
                    <div className="stat-card">
                      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', marginBottom: 12 }}>
                        <Lightbulb size={16} /> Key points
                      </h2>
                      <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-2)', lineHeight: 1.8 }}>
                        {meeting.key_points.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  )}

                  {meeting.decisions?.length > 0 && (
                    <div className="stat-card">
                      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', marginBottom: 12 }}>
                        <CheckSquare size={16} /> Decisions
                      </h2>
                      <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-2)', lineHeight: 1.8 }}>
                        {meeting.decisions.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    </div>
                  )}

                  {meeting.action_items?.length > 0 && (
                    <div className="stat-card">
                      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', marginBottom: 12 }}>
                        <User size={16} /> Action items
                      </h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {meeting.action_items.map((a, i) => (
                          <div key={i} style={{ padding: '8px 0', borderBottom: i < meeting.action_items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <p style={{ margin: 0, color: 'var(--text-1)' }}>{a.text}</p>
                            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-3)' }}>
                              {a.owner || 'Unassigned'}{a.due_date ? ` · Due ${a.due_date}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {meeting.risks?.length > 0 && (
                    <div className="stat-card">
                      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', marginBottom: 12 }}>
                        <AlertTriangle size={16} color="#facc15" /> Risks & blockers
                      </h2>
                      <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-2)', lineHeight: 1.8 }}>
                        {meeting.risks.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="stat-card">
                    <h2 style={{ fontSize: '1rem', marginBottom: 12 }}>Full transcript</h2>
                    <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                      {meeting.transcript_text}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </main>
      </div>
    </div>
  )
}