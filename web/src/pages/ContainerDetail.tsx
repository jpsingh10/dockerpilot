import { useParams, Link } from 'react-router-dom'
import { useContainerWebSocket } from '../hooks/useWebSocket'
import LogsTerminal from '../components/LogsTerminal'
import MetricsChart from '../components/MetricsChart'
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react'

export default function ContainerDetail() {
  const { id } = useParams<{ id: string }>()
  const { logs, metrics, connected, clearLogs } = useContainerWebSocket(id || null)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></Link>
        <div>
          <h2 className="text-lg font-semibold text-white">Container Detail</h2>
          <p className="text-xs text-gray-500 font-mono">{id?.slice(0, 12)}</p>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {connected ? (
            <><Wifi size={14} className="text-green-400" /><span className="text-xs text-green-400">Connected</span></>
          ) : (
            <><WifiOff size={14} className="text-red-400" /><span className="text-xs text-red-400">Disconnected</span></>
          )}
        </div>
      </div>
      <section>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Real-time Metrics</h3>
        {metrics.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500 text-sm">Waiting for metrics data...</div>
        ) : (
          <MetricsChart metrics={metrics} />
        )}
      </section>
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-400">Live Logs</h3>
          <button onClick={clearLogs} className="text-xs text-gray-500 hover:text-gray-300">Clear</button>
        </div>
        <LogsTerminal logs={logs} />
      </section>
    </div>
  )
}
