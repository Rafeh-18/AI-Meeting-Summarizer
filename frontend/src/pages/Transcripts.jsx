import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { meetingService } from '../services/meetingService'
import { formatMeetingDate } from '../utils/format'
import { ChevronRight, Search, FileText, ChevronDown, ChevronUp } from 'lucide-react'

export default function Transcripts() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [transcriptCache, setTranscriptCache] = useState({})
  const [loadingId, setLoadingId] = useState(null)

  useEffect(() => {
    meetingService
      .list()
      .then(setMeetings)
      .catch(() => setError('Could not load your meetings. Please try refreshing.'))
      .finally(() => setLoading(false))
  }, [])

  async function toggleExpand(meeting) {
    if (expandedId === meeting.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(meeting.id)

    if (!(meeting.id in transcriptCache)) {
      setLoadingId(meeting.id)
      try {
        const full = await meetingService.get(meeting.id)
        setTranscriptCache((prev) => ({ ...prev, [meeting.id]: full.transcript_text }))
      } catch (err) {
        setTranscriptCache((prev) => ({ ...prev, [meeting.id]: null }))
      } finally {
        setLoadingId(null)
      }
    }
  }

  const filtered = meetings.filter((m) =>
    m.title.toLowerCase().includes(query.trim().toLowerCase())
  )

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <nav className="breadcrumb">
              <span>Home</span>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span className="breadcrumb-current">Transcripts</span>
            </nav>
          </div>
          <div className="dash-topbar-right">
            <div className="search-input-wrap">
              <Search size={14} className="search-input-icon" />
              <input
                placeholder="Search transcripts…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        <main className="dash-content">
          <div className="page-head">
            <div>
              <h1>Transcripts</h1>
              <p>Full text from every meeting Clario has processed.</p>
            </div>
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
              Loading transcripts…
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><FileText size={28} /></div>
              <h3>{meetings.length === 0 ? 'No transcripts yet' : 'No matches'}</h3>
              <p>
                {meetings.length === 0
                  ? 'Once a meeting is processed, its transcript will show up here.'
                  : 'Try a different search term.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((m) => {
                const isOpen = expandedId === m.id
                const transcript = transcriptCache[m.id]
                return (
                  <div key={m.id} className="stat-card" style={{ cursor: 'pointer' }}>
                    <div
                      onClick={() => toggleExpand(m)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div>
                        <p className="meeting-name">{m.title}</p>
                        <p className="meeting-meta">{formatMeetingDate(m.meeting_date)}</p>
                      </div>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>

                    {isOpen && (
                      <div style={{
                        marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)',
                        fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}>
                        {loadingId === m.id ? (
                          'Loading transcript…'
                        ) : transcript ? (
                          transcript
                        ) : (
                          <span style={{ color: 'var(--text-3)' }}>
                            No transcript available for this meeting yet.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}