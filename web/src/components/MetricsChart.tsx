import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface MetricPoint {
  timestamp: string
  cpuPerc: string
  memPerc: string
  memUsage: string
}

export default function MetricsChart({ metrics }: { metrics: MetricPoint[] }) {
  const data = metrics.map((m, i) => ({
    idx: i,
    cpu: parseFloat(m.cpuPerc) || 0,
    mem: parseFloat(m.memPerc) || 0,
    time: new Date(m.timestamp).toLocaleTimeString(),
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-400 mb-3">CPU Usage (%)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} />
            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} labelStyle={{ color: '#9ca3af' }} />
            <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Memory Usage (%)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} />
            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} labelStyle={{ color: '#9ca3af' }} />
            <Line type="monotone" dataKey="mem" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {metrics.length > 0 && (
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-xs text-gray-500">CPU</p><p className="text-lg font-mono text-blue-400">{metrics[metrics.length - 1].cpuPerc}%</p></div>
            <div><p className="text-xs text-gray-500">Memory</p><p className="text-lg font-mono text-green-400">{metrics[metrics.length - 1].memPerc}%</p></div>
            <div><p className="text-xs text-gray-500">Memory Usage</p><p className="text-sm font-mono text-gray-300">{metrics[metrics.length - 1].memUsage}</p></div>
            <div><p className="text-xs text-gray-500">Data Points</p><p className="text-lg font-mono text-gray-300">{metrics.length}</p></div>
          </div>
        </div>
      )}
    </div>
  )
}
