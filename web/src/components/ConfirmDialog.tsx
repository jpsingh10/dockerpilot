import { useEffect } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  confirmVariant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  const isDanger = confirmVariant === 'danger'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      <div className="surface relative z-10 w-full max-w-md shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text)]"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${isDanger ? 'bg-[color-mix(in_srgb,var(--danger)_16%,var(--surface))] text-[var(--danger)]' : 'bg-[color-mix(in_srgb,var(--warning)_16%,var(--surface))] text-[var(--warning)]'}`}>
              {isDanger ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div className="pt-1">
              <h2
                id="confirm-dialog-title"
                className="text-base font-semibold"
              >
                {title}
              </h2>
            </div>
          </div>

          <p className="mb-6 pl-14 text-sm leading-relaxed text-[var(--text-muted)]">
            {message}
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`btn ${isDanger ? 'btn-danger' : 'btn-secondary'}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
