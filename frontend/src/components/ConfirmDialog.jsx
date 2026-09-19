import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-card" style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{
            background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 8,
            color: '#f87171', flexShrink: 0,
          }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{title}</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-2)' }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn-sm"
            style={{ background: '#ef4444', color: '#fff' }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}