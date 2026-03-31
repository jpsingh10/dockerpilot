const colors: Record<string, string> = {
  running: 'bg-green-900/50 text-green-400',
  exited: 'bg-red-900/50 text-red-400',
  stopped: 'bg-gray-700 text-gray-400',
  created: 'bg-blue-900/50 text-blue-400',
  paused: 'bg-yellow-900/50 text-yellow-400',
  bridge: 'bg-green-900/50 text-green-400',
  macvlan: 'bg-yellow-900/50 text-yellow-400',
  host: 'bg-blue-900/50 text-blue-400',
  overlay: 'bg-purple-900/50 text-purple-400',
  local: 'bg-gray-700 text-gray-300',
  success: 'bg-green-900/50 text-green-400',
  failed: 'bg-red-900/50 text-red-400',
  pending: 'bg-yellow-900/50 text-yellow-400',
}

export default function StatusBadge({ status }: { status: string }) {
  const color = colors[status?.toLowerCase()] || 'bg-gray-700 text-gray-300'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{status}</span>
}
