import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { meetingService } from '../services/meetingService'
import { formatMeetingDate } from '../utils/format'
import { ChevronRight, FileDown, Download, Loader2 } from 'lucide-react'

export default function Reports() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    meetingService
      .list()
      .then(setMeetings)
      .catch(() => setError('Could not load your meetings. Please try refreshing.'))
      .finally(() => setLoading(false))
  }, [])

  const availableCount = meetings.filter((m) => m.status === 'processed').length

  const handleDownload = async (meeting) => {
    setError('')
    setDownloadingId(meeting.id)
    try {
      await meetingService.downloadPdf(meeting.id, `${meeting.title}.pdf`)
      setMeetings((prev) =>
        prev.map((m) => (m.id === meeting.id ? { ...m, has_pdf: true } : m))
      )
    } catch {
      setError('Could not generate the report. Please try again.')
    } finally {
      setDownloadingId(null)
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
              <span className="breadcrumb-current">Reports</span>
            </nav>
          </div>
        </header>

        <main className="dash-content">
          <div className="page-head">
            <div>
              <h1>Reports</h1>
              <p>{availableCount} of {meetings.length} meetings have a downloadable PDF report.</p>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 8, padding: '10px 14px', fontSize: '0.875rem', marginBottom: 16 }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
              Loading reports…
            </div>
          ) : meetings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><FileDown size={28} /></div>
              <h3>No reports yet</h3>
              <p>Upload a meeting first — reports are generated once processing is available.</p>
            </div>
          ) : (
            <div className="meetings-table-wrap">
              <table className="meetings-table">
                <thead>
                  <tr>
                    <th>Meeting</th>
                    <th>Date</th>
                    <th>Report</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((m) => {
                    const isReady = m.status === 'processed'
                    const isDownloading = downloadingId === m.id

                    return (
                      <tr key={m.id}>
                        <td>
                          <p className="meeting-name">{m.title}</p>
                        </td>
                        <td className="td-date">{formatMeetingDate(m.meeting_date)}</td>
                        <td>
                          {m.has_pdf ? (
                            <span className="badge badge-green">✓ Ready</span>
                          ) : isReady ? (
                            <span className="badge badge-muted">Not generated yet</span>
                          ) : (
                            <span className="badge badge-muted">Awaiting processing</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn-icon"
                            title={isReady ? 'Download PDF' : 'Process this meeting first'}
                            disabled={!isReady || isDownloading}
                            onClick={() => handleDownload(m)}
                          >
                            {isDownloading ? (
                              <Loader2 size={15} className="spin" />
                            ) : (
                              <Download size={15} />
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}