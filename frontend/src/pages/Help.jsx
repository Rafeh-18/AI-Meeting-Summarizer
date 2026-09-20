import { useState } from 'react'
import { ChevronRight, ChevronDown, Mail, Upload, Sparkles, MessageSquare } from 'lucide-react'
import Sidebar from '../components/Sidebar'

const FAQS = [
  {
    q: 'What audio and video formats are supported?',
    a: 'You can upload MP3, WAV, M4A, MP4, or MOV files, or record directly from your browser microphone. Files up to 500 MB are supported.',
  },
  {
    q: 'How long does processing take?',
    a: 'Transcription and summarization together usually take under a minute for most meetings, though longer recordings take a bit more time.',
  },
  {
    q: 'Can I chat about a meeting after it\'s processed?',
    a: 'Yes — every processed meeting has its own chat, grounded in that meeting\'s transcript. Ask about decisions, action items, or anything discussed, and it\'ll answer only from what was actually said (or tell you if it wasn\'t covered).',
  },
  {
    q: 'How do I download a PDF report?',
    a: 'Open any processed meeting and click "Generate PDF" — it\'s created on the spot and downloads automatically.',
  },
  {
    q: 'Is my meeting data private?',
    a: 'Your meetings, transcripts, and chats are tied to your account and only visible to you.',
  },
  {
    q: 'Can I delete a meeting?',
    a: 'Yes — hover over any meeting in the Recents list in the sidebar and click the trash icon. This permanently deletes the recording, transcript, summary, and any generated report.',
  },
]

function FaqItem({ q, a, isOpen, onToggle }) {
  return (
    <div className="faq-item">
      <button className={`faq-question ${isOpen ? 'open' : ''}`} onClick={onToggle}>
        {q}
        <ChevronDown size={16} />
      </button>
      {isOpen && <p className="faq-answer">{a}</p>}
    </div>
  )
}

export default function Help() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <nav className="breadcrumb">
              <span>Home</span>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span className="breadcrumb-current">Help</span>
            </nav>
          </div>
        </header>

        <main className="dash-content" style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="page-head">
            <div>
              <h1>Help &amp; support</h1>
              <p>Quick answers, or reach out directly if you're stuck.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 28 }}>
            <div className="help-topic-card">
              <div className="help-topic-icon"><Upload size={17} /></div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>Getting started</p>
                <p className="body-sm" style={{ color: 'var(--text-3)' }}>Upload or record a meeting to begin.</p>
              </div>
            </div>
            <div className="help-topic-card">
              <div className="help-topic-icon"><Sparkles size={17} /></div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>Summaries</p>
                <p className="body-sm" style={{ color: 'var(--text-3)' }}>Key points, decisions & action items.</p>
              </div>
            </div>
            <div className="help-topic-card">
              <div className="help-topic-icon"><MessageSquare size={17} /></div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>AI chat</p>
                <p className="body-sm" style={{ color: 'var(--text-3)' }}>Ask questions about any meeting.</p>
              </div>
            </div>
          </div>

          <div className="card card-p" style={{ marginBottom: 24 }}>
            <h2 className="heading-md" style={{ marginBottom: 4 }}>Frequently asked questions</h2>
            <div>
              {FAQS.map((item, i) => (
                <FaqItem
                  key={item.q}
                  q={item.q}
                  a={item.a}
                  isOpen={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
                />
              ))}
            </div>
          </div>

          <div className="card card-p" style={{ textAlign: 'center' }}>
            <div className="help-topic-icon" style={{ margin: '0 auto 12px' }}>
              <Mail size={17} />
            </div>
            <h3 className="heading-md" style={{ marginBottom: 4 }}>Still need help?</h3>
            <p className="body-sm" style={{ color: 'var(--text-2)', marginBottom: 16 }}>
              Send us a message and we'll get back to you.
            </p>
            <a href="mailto:support@clario.app" className="btn btn-primary">
              <Mail size={15} />
              support@clario.app
            </a>
          </div>
        </main>
      </div>
    </div>
  )
}