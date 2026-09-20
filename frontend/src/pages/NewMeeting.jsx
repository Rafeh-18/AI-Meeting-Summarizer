import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  UploadCloud, Mic, Sparkles, Download, Loader2,
  ListChecks, Flag, AlertTriangle, MessageSquare, ChevronRight,
  Send, Bot, User,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import UploadModal from '../components/UploadModal'
import { meetingService } from '../services/meetingService'
import { formatDuration } from '../utils/format'

function ChatBox({ meetingId }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState('')
  const [chatError, setChatError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    meetingService
      .getChatHistory(meetingId)
      .then(setMessages)
      .catch(() => setChatError('Could not load chat history.'))
      .finally(() => setLoading(false))
  }, [meetingId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function handleSend(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    setDraft('')
    setChatError('')
    setSending(true)
    setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, role: 'user', content: text }])
    try {
      const { user_message, assistant_message } = await meetingService.sendChatMessage(meetingId, text)
      setMessages((prev) => [
        ...prev.filter((m) => !String(m.id).startsWith('temp-')),
        user_message,
        assistant_message,
      ])
    } catch (err) {
      setChatError(err.response?.data?.error || 'Message failed to send.')
      setMessages((prev) => prev.filter((m) => !String(m.id).startsWith('temp-')))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="meeting-chat-box">
      <div className="meeting-chat-messages">
        {loading ? (
          <p className="meeting-chat-empty">Loading chat…</p>
        ) : messages.length === 0 ? (
          <p className="meeting-chat-empty">Ask anything about this meeting — answers are grounded in its transcript.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`chat-bubble-row ${m.role}`}>
              <div className={`chat-bubble-avatar ${m.role}`}>
                {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
              </div>
              <div className={`chat-bubble ${m.role}`}>{m.content}</div>
            </div>
          ))
        )}
        {sending && (
          <div className="chat-bubble-row assistant">
            <div className="chat-bubble-avatar assistant"><Bot size={12} /></div>
            <div className="chat-bubble assistant" style={{ color: 'var(--text-3)' }}>Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {chatError && (
        <p style={{ color: 'var(--red)', fontSize: '0.75rem', padding: '0 10px' }}>{chatError}</p>
      )}

      <form className="meeting-chat-form" onSubmit={handleSend}>
        <input
          className="form-input"
          placeholder="Ask about this meeting…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={sending}
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={sending || !draft.trim()}>
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card card-p" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Icon size={16} style={{ color: 'var(--accent-dark)' }} />
        <h3 className="heading-md" style={{ fontSize: '1rem' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function NewMeeting() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [activeMeeting, setActiveMeeting] = useState(null)
  const [loadingMeeting, setLoadingMeeting] = useState(false)
  const [modalTab, setModalTab] = useState(null) // null | 'upload' | 'record'
  const [processing, setProcessing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    if (!id) {
      setActiveMeeting(null)
      return
    }
    setLoadingMeeting(true)
    meetingService
      .get(id)
      .then(setActiveMeeting)
      .catch(() => setError('Could not load that meeting.'))
      .finally(() => setLoadingMeeting(false))
  }, [id])

  async function handleSummarize() {
    setProcessing(true)
    setError('')
    try {
      const updated = await meetingService.process(activeMeeting.id)
      setActiveMeeting(updated)
    } catch (err) {
      setError(err.response?.data?.error || 'Processing failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  async function handleDownload() {
    setDownloading(true)
    setError('')
    try {
      await meetingService.downloadPdf(activeMeeting.id, `${activeMeeting.title}.pdf`)
      setActiveMeeting((m) => ({ ...m, has_pdf: true }))
    } catch {
      setError('Could not generate the PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const isProcessed = activeMeeting?.status === 'processed'

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <nav className="breadcrumb">
              <span>Home</span>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span className="breadcrumb-current">
                {activeMeeting ? activeMeeting.title : 'New meeting'}
              </span>
            </nav>
          </div>
        </header>

        <main className="dash-content" style={{ maxWidth: 760, margin: '0 auto' }}>
          {error && (
            <div style={{
              background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)',
              color: 'var(--red)', borderRadius: 8, padding: '10px 14px',
              fontSize: '0.875rem', marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {loadingMeeting && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
              Loading…
            </div>
          )}

          {/* Welcome state — no id in the URL */}
          {!loadingMeeting && !id && (
            <div style={{ maxWidth: 640, margin: '48px auto 0' }}>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <h1 className="display-lg" style={{ marginBottom: 8 }}>Start a new meeting</h1>
                <p className="body-md" style={{ color: 'var(--text-2)' }}>
                  Upload a recording or capture one live — Clario takes it from there.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <button
                  className="card card-p"
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => setModalTab('upload')}
                >
                  <div className="dropzone-icon" style={{ marginBottom: 18 }}>
                    <UploadCloud size={26} />
                  </div>
                  <h3 className="heading-md" style={{ marginBottom: 6 }}>Upload a file</h3>
                  <p className="body-sm" style={{ color: 'var(--text-2)' }}>
                    MP3, WAV, M4A, MP4 or MOV — up to 500 MB.
                  </p>
                </button>

                <button
                  className="card card-p"
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => setModalTab('record')}
                >
                  <div className="dropzone-icon" style={{ marginBottom: 18 }}>
                    <Mic size={26} />
                  </div>
                  <h3 className="heading-md" style={{ marginBottom: 6 }}>Record live</h3>
                  <p className="body-sm" style={{ color: 'var(--text-2)' }}>
                    Capture straight from your browser's microphone.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Ready to summarize */}
          {!loadingMeeting && activeMeeting && !isProcessed && (
            <div style={{ textAlign: 'center', padding: '64px 24px' }}>
              <h2 className="heading-lg" style={{ marginBottom: 6 }}>{activeMeeting.title}</h2>
              <p className="body-sm" style={{ color: 'var(--text-3)', marginBottom: 32 }}>
                Saved — {activeMeeting.status === 'uploaded' ? 'ready to process' : activeMeeting.status}
              </p>

              <button className="btn btn-primary btn-lg" onClick={handleSummarize} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Transcribing &amp; summarizing…
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Summarize
                  </>
                )}
              </button>
            </div>
          )}

          {/* Full content */}
          {!loadingMeeting && activeMeeting && isProcessed && (
            <div>
              <div className="page-head">
                <div>
                  <h1>{activeMeeting.title}</h1>
                  <p>{formatDuration(activeMeeting.duration_seconds)} · Processed</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleDownload} disabled={downloading}>
                  {downloading ? <Loader2 size={15} className="spin" /> : <Download size={15} />}
                  Generate PDF
                </button>
              </div>

              <Section icon={Sparkles} title="Summary">
                <p className="body-md" style={{ color: 'var(--text-1)' }}>
                  {activeMeeting.summary_text || 'No summary available.'}
                </p>
              </Section>

              {activeMeeting.key_points?.length > 0 && (
                <Section icon={ListChecks} title="Key points">
                  <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activeMeeting.key_points.map((p, i) => (
                      <li key={i} className="body-sm" style={{ color: 'var(--text-1)', listStyle: 'disc' }}>{p}</li>
                    ))}
                  </ul>
                </Section>
              )}

              {activeMeeting.decisions?.length > 0 && (
                <Section icon={Flag} title="Decisions">
                  <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activeMeeting.decisions.map((d, i) => (
                      <li key={i} className="body-sm" style={{ color: 'var(--text-1)', listStyle: 'disc' }}>{d}</li>
                    ))}
                  </ul>
                </Section>
              )}

              {activeMeeting.action_items?.length > 0 && (
                <Section icon={ListChecks} title="Action items">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {activeMeeting.action_items.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', gap: 12,
                        padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)',
                      }}>
                        <span className="body-sm">{item.text}</span>
                        <span className="body-sm" style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                          {item.owner || '—'}{item.due_date ? ` · ${item.due_date}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {activeMeeting.risks?.length > 0 && (
                <Section icon={AlertTriangle} title="Risks &amp; issues">
                  <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activeMeeting.risks.map((r, i) => (
                      <li key={i} className="body-sm" style={{ color: 'var(--text-1)', listStyle: 'disc' }}>{r}</li>
                    ))}
                  </ul>
                </Section>
              )}

              <Section icon={MessageSquare} title="Transcript">
                <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 8 }}>
                  <p className="body-sm" style={{ color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
                    {activeMeeting.transcript_text || 'Transcript unavailable.'}
                  </p>
                </div>
              </Section>

              <Section icon={Bot} title="Chat about this meeting">
                <ChatBox meetingId={activeMeeting.id} />
              </Section>
            </div>
          )}
        </main>
      </div>

      {modalTab && (
        <UploadModal
          initialTab={modalTab}
          onClose={() => setModalTab(null)}
          onUploaded={(m) => navigate(`/new-meeting/${m.id}`)}
        />
      )}
    </div>
  )
}