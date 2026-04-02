const colors: Record<string, string> = {
  running: 'badge-success',
  exited: 'badge-danger',
  stopped: 'badge-neutral',
  created: 'badge-neutral',
  paused: 'badge-warning',
  bridge: 'badge-success',
  macvlan: 'badge-warning',
  host: 'badge-neutral',
  overlay: 'badge-neutral',
  local: 'badge-neutral',
  success: 'badge-success',
  failed: 'badge-danger',
  pending: 'badge-warning',
  admin: 'badge-danger',
  user: 'badge-neutral',
  viewer: 'badge-neutral',
}

export default function StatusBadge({ status }: { status: string }) {
  const key = status?.toLowerCase()
  const color = colors[key] || 'badge-neutral'
  return <span className={`badge ${color}`}>{status}</span>
}
