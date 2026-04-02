import { useEffect } from 'react'
import { create } from 'zustand'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

const AUTO_DISMISS_MS = 4000

const typeConfig: Record<ToastType, { icon: React.ElementType; bg: string; border: string; iconColor: string }> = {
  success: {
    icon: CheckCircle,
    bg: 'surface',
    border: 'border-[color-mix(in_srgb,var(--success)_28%,transparent)]',
    iconColor: 'text-[var(--success)]',
  },
  error: {
    icon: XCircle,
    bg: 'surface',
    border: 'border-[color-mix(in_srgb,var(--danger)_28%,transparent)]',
    iconColor: 'text-[var(--danger)]',
  },
  info: {
    icon: Info,
    bg: 'surface',
    border: 'border-[color-mix(in_srgb,var(--info)_28%,transparent)]',
    iconColor: 'text-[var(--info)]',
  },
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore()
  const { icon: Icon, bg, border, iconColor } = typeConfig[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [toast.id, removeToast])

  return (
    <div
      className={`flex min-w-[260px] max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${bg} ${border}`}
      role="alert"
    >
      <Icon size={18} className={`flex-shrink-0 mt-0.5 ${iconColor}`} />
      <p className="flex-1 text-sm leading-snug text-[var(--text)]">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 rounded p-0.5 text-[var(--text-soft)] transition-colors hover:text-[var(--text)]"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
