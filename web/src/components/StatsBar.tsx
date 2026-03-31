import { useEffect } from 'react'
import { useSystemStore } from '../store/system'

export default function StatsBar() {
  const { info, fetch } = useSystemStore()

  useEffect(() => { fetch() }, [fetch])

  if (!info) return null

  const memGB = (info.MemTotal / 1024 / 1024 / 1024).toFixed(1) + ' GB'

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-[#0d1320] border-b border-gray-800 text-xs text-gray-400">
      <span>Docker <span className="text-gray-200 font-medium">{info.ServerVersion}</span></span>
      <span>|</span>
      <span><span className="text-gray-200 font-medium">{info.NCPU}</span> cores</span>
      <span>|</span>
      <span><span className="text-gray-200 font-medium">{memGB}</span></span>
      <span>|</span>
      <span><span className="text-gray-200 font-medium">{info.ContainersRunning}</span> running</span>
      <span>|</span>
      <span><span className="text-gray-200 font-medium">{info.ContainersStopped}</span> stopped</span>
      <span>|</span>
      <span><span className="text-gray-200 font-medium">{info.Images}</span> images</span>
    </div>
  )
}
