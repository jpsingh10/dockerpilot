import { useEffect } from 'react'
import { useSystemStore } from '../store/system'

export default function StatsBar() {
  const { info, fetch } = useSystemStore()

  useEffect(() => { fetch() }, [fetch])

  if (!info) return null

  const memGB = (info.MemTotal / 1024 / 1024 / 1024).toFixed(1) + ' GB'

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-xs text-[var(--text-muted)]">
      <span>Docker <span className="font-medium text-[var(--text)]">{info.ServerVersion}</span></span>
      <span className="text-[var(--text-soft)]">•</span>
      <span><span className="font-medium text-[var(--text)]">{info.NCPU}</span> cores</span>
      <span className="text-[var(--text-soft)]">•</span>
      <span><span className="font-medium text-[var(--text)]">{memGB}</span></span>
      <span className="text-[var(--text-soft)]">•</span>
      <span><span className="font-medium text-[var(--success)]">{info.ContainersRunning}</span> running</span>
      <span className="text-[var(--text-soft)]">•</span>
      <span><span className="font-medium text-[var(--text)]">{info.ContainersStopped}</span> stopped</span>
      <span className="text-[var(--text-soft)]">•</span>
      <span><span className="font-medium text-[var(--text)]">{info.Images}</span> images</span>
    </div>
  )
}
