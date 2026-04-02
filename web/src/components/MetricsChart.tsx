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

  const cssVar = (name: string, fallback: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

  const grid = cssVar('--border', '#2d3446')
  const muted = cssVar('--text-soft', '#748092')
  const text = cssVar('--text', '#eef2f7')
  const surface = cssVar('--surface', '#1a1f2b')
  const primary = cssVar('--primary', '#7c9cff')
  const success = cssVar('--success', '#4bd18b')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="surface p-4">
        <h4 className="mb-3 text-sm font-medium text-[var(--text-muted)]">CPU Usage (%)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: muted }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: muted }} />
            <Tooltip contentStyle={{ backgroundColor: surface, border: `1px solid ${grid}`, borderRadius: '8px', color: text }} labelStyle={{ color: muted }} />
            <Line type="monotone" dataKey="cpu" stroke={primary} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="surface p-4">
        <h4 className="mb-3 text-sm font-medium text-[var(--text-muted)]">Memory Usage (%)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: muted }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: muted }} />
            <Tooltip contentStyle={{ backgroundColor: surface, border: `1px solid ${grid}`, borderRadius: '8px', color: text }} labelStyle={{ color: muted }} />
            <Line type="monotone" dataKey="mem" stroke={success} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {metrics.length > 0 && (
        <div className="surface lg:col-span-2 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-xs text-[var(--text-soft)]">CPU</p><p className="text-lg font-mono text-[var(--primary)]">{metrics[metrics.length - 1].cpuPerc}%</p></div>
            <div><p className="text-xs text-[var(--text-soft)]">Memory</p><p className="text-lg font-mono text-[var(--success)]">{metrics[metrics.length - 1].memPerc}%</p></div>
            <div><p className="text-xs text-[var(--text-soft)]">Memory Usage</p><p className="text-sm font-mono text-[var(--text-muted)]">{metrics[metrics.length - 1].memUsage}</p></div>
            <div><p className="text-xs text-[var(--text-soft)]">Data Points</p><p className="text-lg font-mono text-[var(--text-muted)]">{metrics.length}</p></div>
          </div>
        </div>
      )}
    </div>
  )
}
