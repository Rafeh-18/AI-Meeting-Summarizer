import { useEffect, useRef, useState } from 'react'
import { X, UploadCloud, Mic, FileAudio, Film, ArrowRight, Square, Trash2 } from 'lucide-react'
import { meetingService } from '../services/meetingService'

const ACCEPTED_EXT = ['mp3', 'wav', 'm4a', 'mp4', 'mov']

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function UploadModal({ onClose, onUploaded, initialTab = 'upload' }) {
  const [tab, setTab] = useState(initialTab)
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function validateAndSetFile(file) {
    const ext = file.name.split('.').pop().toLowerCase()
    if (!ACCEPTED_EXT.includes(ext)) {
      setError(`Unsupported file type ".${ext}". Accepted: ${ACCEPTED_EXT.join(', ').toUpperCase()}`)
      return
    }
    setError('')
    setSelectedFile(file)
  }

  function handleFileInputChange(e) {
    const file = e.target.files?.[0]
    if (file) validateAndSetFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndSetFile(file)
  }

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setRecordedBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } catch (err) {
      setError('Microphone access was denied or is unavailable.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    clearInterval(timerRef.current)
  }

  function discardRecording() {
    setRecordedBlob(null)
    setElapsed(0)
  }

  async function handleSubmit() {
    setError('')

    const fileToUpload =
      tab === 'upload'
        ? selectedFile
        : recordedBlob
        ? new File([recordedBlob], `recording-${Date.now()}.webm`, { type: recordedBlob.type })
        : null

    if (!fileToUpload) {
      setError(tab === 'upload' ? 'Choose a file first.' : 'Record something first.')
      return
    }

    const formData = new FormData()
    formData.append('file', fileToUpload)
    if (title.trim()) formData.append('title', title.trim())

    setUploading(true)
    try {
      const meeting = await meetingService.upload(formData)
      onUploaded?.(meeting)
      onClose()
    } catch (err) {
      setError(err.response?.data?.errors?.file || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2>New meeting</h2>
            <p>Upload a file or record directly from your browser</p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="upload-tabs">
          <button
            className={`upload-tab ${tab === 'upload' ? 'active' : ''}`}
            onClick={() => setTab('upload')}
          >
            <UploadCloud size={15} />
            Upload file
          </button>
          <button
            className={`upload-tab ${tab === 'record' ? 'active' : ''}`}
            onClick={() => setTab('record')}
          >
            <Mic size={15} />
            Live recording
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)',
            color: 'var(--red)', borderRadius: 8, padding: '10px 14px',
            fontSize: '0.875rem', margin: '0 0 16px',
          }}>
            {error}
          </div>
        )}

        {/* Title input, shared by both tabs */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Meeting title (optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Q3 Roadmap Review"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {tab === 'upload' && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,.mp4,.mov"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
            <div
              className="dropzone"
              style={{
                cursor: 'pointer',
                ...(isDragging
                  ? { borderColor: 'var(--accent)', background: 'var(--accent-glow)' }
                  : {}),
              }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
            >
              <div className="dropzone-icon">
                <UploadCloud size={24} />
              </div>
              {selectedFile ? (
                <>
                  <h3>{selectedFile.name}</h3>
                  <p>{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB — click to choose a different file</p>
                </>
              ) : (
                <>
                  <h3>Drop your file here</h3>
                  <p>or <span style={{ color: 'var(--accent-dark)', fontWeight: 600 }}>browse to choose</span> from your computer</p>
                </>
              )}
              <div className="dropzone-formats">
                {['MP3', 'WAV', 'M4A', 'MP4', 'MOV'].map((f) => (
                  <span key={f} className="format-chip">{f}</span>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'record' && (
          <div className="record-zone">
            <div className="record-btn-wrap">
              {!recordedBlob ? (
                <>
                  <button
                    className="record-pulse-btn"
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? <Square size={24} /> : <Mic size={28} />}
                  </button>
                  <p className="record-label">
                    {isRecording ? `Recording… ${formatTimer(elapsed)}` : 'Click to start recording'}
                  </p>
                  {!isRecording && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className="badge badge-muted">
                        <FileAudio size={11} /> Audio
                      </span>
                      <span className="badge badge-muted">
                        <Film size={11} /> Screen + audio
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="record-label">Recording captured — {formatTimer(elapsed)}</p>
                  <audio controls src={URL.createObjectURL(recordedBlob)} style={{ width: '100%' }} />
                  <button className="btn btn-ghost btn-sm" onClick={discardRecording}>
                    <Trash2 size={14} /> Discard and re-record
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="modal-footer">
          <p className="body-sm" style={{ color: 'var(--text-3)' }}>
            Max file size: 500 MB
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={uploading}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={uploading || isRecording}>
              {uploading ? 'Uploading…' : 'Upload & save'}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}