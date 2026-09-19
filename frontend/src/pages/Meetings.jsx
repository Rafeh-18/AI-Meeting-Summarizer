import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import UploadModal from '../components/UploadModal'
import ConfirmDialog from '../components/ConfirmDialog'
import { meetingService } from '../services/meetingService'
import { formatDuration, formatMeetingDate } from '../utils/format'
import {
    Plus, Search, ChevronRight, Video,
    Download, Eye, Trash2, Mic, Upload, Sparkles,
} from 'lucide-react'

function StatusBadge({ status }) {
    if (status === 'processed')
        return <span className="badge badge-green">✓ Processed</span>
    if (status === 'processing')
        return <span className="badge badge-yellow">⏳ Processing…</span>
    return <span className="badge badge-muted">{status}</span>
}

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'processed', label: 'Processed' },
    { key: 'processing', label: 'Processing' },
]

export default function Meetings() {
    const navigate = useNavigate()
    const [meetings, setMeetings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')
    const [filter, setFilter] = useState('all')
    const [uploadOpen, setUploadOpen] = useState(false)
    const [pendingDeleteId, setPendingDeleteId] = useState(null)
    const [processingId, setProcessingId] = useState(null)

    async function load() {
        setLoading(true)
        setError('')
        try {
            const data = await meetingService.list()
            setMeetings(data)
        } catch (err) {
            setError('Could not load your meetings. Please try refreshing.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    async function confirmDelete() {
        const id = pendingDeleteId
        setPendingDeleteId(null)
        try {
            await meetingService.remove(id)
            setMeetings((prev) => prev.filter((m) => m.id !== id))
        } catch (err) {
            setError('Could not delete that meeting.')
        }
    }

    async function handleProcess(id) {
        setProcessingId(id)
        setError('')
        try {
            const updated = await meetingService.process(id)
            setMeetings((prev) => prev.map((m) => (m.id === id ? updated : m)))
        } catch (err) {
            setError(err.response?.data?.error || 'Processing failed.')
        } finally {
            setProcessingId(null)
        }
    }

    const filtered = useMemo(() => {
        return meetings.filter((m) => {
            const matchesFilter = filter === 'all' ? true : m.status === filter
            const matchesQuery = m.title.toLowerCase().includes(query.trim().toLowerCase())
            return matchesFilter && matchesQuery
        })
    }, [meetings, filter, query])

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="dashboard-main">
                <header className="dash-topbar">
                    <div className="dash-topbar-left">
                        <nav className="breadcrumb">
                            <span>Home</span>
                            <ChevronRight size={12} className="breadcrumb-sep" />
                            <span className="breadcrumb-current">Meetings</span>
                        </nav>
                    </div>
                    <div className="dash-topbar-right">
                        <div className="search-input-wrap">
                            <Search size={14} className="search-input-icon" />
                            <input
                                placeholder="Search meetings…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => setUploadOpen(true)}>
                            <Plus size={15} />
                            New meeting
                        </button>
                    </div>
                </header>

                <main className="dash-content">
                    <div className="page-head">
                        <div>
                            <h1>Meetings</h1>
                            <p>{meetings.length} total — every recording you've uploaded or captured.</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>
                            <Upload size={16} />
                            Upload meeting
                        </button>
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

                    <section className="meetings-section">
                        <div className="meetings-header">
                            <h2>All meetings</h2>
                            <div className="meetings-filters">
                                {FILTERS.map((f) => (
                                    <button
                                        key={f.key}
                                        className="btn btn-ghost btn-sm"
                                        style={filter === f.key ? { color: 'var(--accent-bright)', background: 'rgba(99,102,241,0.1)' } : undefined}
                                        onClick={() => setFilter(f.key)}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="meetings-table-wrap">
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
                                    Loading meetings…
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon"><Mic size={28} /></div>
                                    <h3>{meetings.length === 0 ? 'No meetings yet' : 'No matches'}</h3>
                                    <p>
                                        {meetings.length === 0
                                            ? "Upload your first recording and Clario will take it from there."
                                            : 'Try a different search term or filter.'}
                                    </p>
                                    {meetings.length === 0 && (
                                        <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>
                                            <Plus size={15} /> Upload a meeting
                                        </button>
                                    )}
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
                                        {filtered.map((m) => (
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
                                                        <span style={{ color: 'var(--accent-bright)' }}>
                                                            {m.action_item_count} items
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-3)' }}>—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="td-row-actions">
                                                        {m.status === 'uploaded' && (
                                                            <button
                                                                className="btn-icon"
                                                                title="Process with AI"
                                                                onClick={() => handleProcess(m.id)}
                                                                disabled={processingId === m.id}
                                                            >
                                                                {processingId === m.id ? '…' : <Sparkles size={15} />}
                                                            </button>
                                                        )}
                                                        <button className="btn-icon" title="View" onClick={() => navigate(`/meetings/${m.id}`)}>
                                                            <Eye size={15} />
                                                        </button>
                                                        <button className="btn-icon" title="Download PDF" disabled={!m.has_pdf}>
                                                            <Download size={15} />
                                                        </button>
                                                        <button className="btn-icon" title="Delete" onClick={() => setPendingDeleteId(m.id)}>
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
                </main>
            </div>

            {uploadOpen && (
                <UploadModal
                    onClose={() => setUploadOpen(false)}
                    onUploaded={() => load()}
                />
            )}

            {pendingDeleteId && (
                <ConfirmDialog
                    title="Delete this meeting?"
                    message="This will permanently delete the recording, transcript, and any generated report. This can't be undone."
                    onConfirm={confirmDelete}
                    onCancel={() => setPendingDeleteId(null)}
                />
            )}
        </div>
    )
}