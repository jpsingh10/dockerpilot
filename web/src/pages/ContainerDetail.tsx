import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useContainerWebSocket } from '../hooks/useWebSocket'
import MetricsChart from '../components/MetricsChart'
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  Search,
  Download,
  ArrowDownToLine,
  X,
  Filter,
} from 'lucide-react'

type LogLevel = 'all' | 'info' | 'warning' | 'error'

function classifyLogLevel(line: string): 'info' | 'warning' | 'error' | 'other' {
  const lower = line.toLowerCase()
  if (lower.includes('error') || lower.includes('err') || lower.includes('fatal') || lower.includes('panic')) return 'error'
  if (lower.includes('warn') || lower.includes('warning')) return 'warning'
  if (lower.includes('info')) return 'info'
  return 'other'
}

function highlightMatch(text: string, search: string): JSX.Element {
  if (!search) return <>{text}</>
  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-[#58a6ff]/30 text-[#58a6ff] rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export default function ContainerDetail() {
  const { id } = useParams<{ id: string }>()
  const { logs, metrics, connected, clearLogs } = useContainerWebSocket(id || null)

  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<LogLevel>('all')
  const [autoScroll, setAutoScroll] = useState(true)

  const logsEndRef = useRef<HTMLDivElement>(null)
  const logsContainerRef = useRef<HTMLDivElement>(null)

  const filteredLogs = useMemo(() => {
    return logs.filter((line) => {
      if (levelFilter !== 'all') {
        const level = classifyLogLevel(line)
        if (levelFilter === 'info' && level !== 'info') return false
        if (levelFilter === 'warning' && level !== 'warning') return false
        if (levelFilter === 'error' && level !== 'error') return false
      }
      if (searchQuery) {
        return line.toLowerCase().includes(searchQuery.toLowerCase())
      }
      return true
    })
  }, [logs, searchQuery, levelFilter])

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [filteredLogs, autoScroll])

  const handleScroll = useCallback(() => {
    const el = logsContainerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    if (!atBottom && autoScroll) {
      setAutoScroll(false)
    }
  }, [autoScroll])

  const handleDownload = useCallback(() => {
    const content = filteredLogs.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `container-${id?.slice(0, 12)}-logs.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredLogs, id])

  const levelColor = (line: string) => {
    const level = classifyLogLevel(line)
    switch (level) {
      case 'error': return 'text-[#f85149]'
      case 'warning': return 'text-[#d29922]'
      case 'info': return 'text-[#58a6ff]'
      default: return 'text-[#8b949e]'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/containers"
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#58a6ff] transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-lg font-semibold text-[#e6edf3]">Container Detail</h2>
          <p className="text-xs text-[#484f58] font-mono">{id?.slice(0, 12)}</p>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {connected ? (
            <>
              <Wifi size={14} className="text-[#3fb950]" />
              <span className="text-xs text-[#3fb950]">Connected</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-[#f85149]" />
              <span className="text-xs text-[#f85149]">Disconnected</span>
            </>
          )}
        </div>
      </div>

      {/* Metrics Section */}
      <section>
        <h3 className="text-sm font-medium text-[#8b949e] mb-3">Real-time Metrics</h3>
        {metrics.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 text-center text-[#484f58] text-sm">
            Waiting for metrics data...
          </div>
        ) : (
          <MetricsChart metrics={metrics} />
        )}
      </section>

      {/* Logs Section */}
      <section>
        {/* Logs Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-[#8b949e]">Live Logs</h3>
            <span className="text-xs text-[#484f58] bg-[#161b22] border border-[#30363d] rounded-md px-2 py-0.5 font-mono">
              {filteredLogs.length} line{filteredLogs.length !== 1 ? 's' : ''}
              {levelFilter !== 'all' || searchQuery ? ` / ${logs.length} total` : ''}
            </span>
          </div>
          <button
            onClick={clearLogs}
            className="text-xs text-[#484f58] hover:text-[#8b949e] transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#484f58]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-8 pr-8 py-1.5 text-xs text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#8b949e]"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Level Filter */}
          <div className="relative">
            <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#484f58] pointer-events-none" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LogLevel)}
              className="appearance-none bg-[#0d1117] border border-[#30363d] rounded-lg pl-8 pr-6 py-1.5 text-xs text-[#e6edf3] focus:outline-none focus:border-[#58a6ff] cursor-pointer transition-colors"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Auto-scroll Toggle */}
          <button
            onClick={() => {
              setAutoScroll(!autoScroll)
              if (!autoScroll && logsEndRef.current) {
                logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
              }
            }}
            className={`flex items-center gap-1.5 border rounded-lg px-3 py-1.5 text-xs transition-colors ${
              autoScroll
                ? 'bg-[#58a6ff]/10 border-[#58a6ff]/40 text-[#58a6ff]'
                : 'bg-[#0d1117] border-[#30363d] text-[#484f58] hover:text-[#8b949e]'
            }`}
            title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
          >
            <ArrowDownToLine size={12} />
            <span>Auto-scroll</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-[#8b949e] hover:text-[#e6edf3] hover:border-[#58a6ff] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Download logs as .txt"
          >
            <Download size={12} />
            <span>Download</span>
          </button>
        </div>

        {/* Log Output */}
        <div
          ref={logsContainerRef}
          onScroll={handleScroll}
          className="h-[400px] bg-[#0d1117] border border-[#30363d] rounded-lg overflow-y-auto font-mono text-xs leading-5 scroll-smooth"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[#484f58] text-sm">
              {logs.length === 0 ? 'Waiting for logs...' : 'No matching log lines'}
            </div>
          ) : (
            <div className="p-3">
              {filteredLogs.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 hover:bg-[#161b22] rounded px-1 -mx-1 ${levelColor(line)}`}
                >
                  <span className="select-none text-[#30363d] min-w-[3ch] text-right shrink-0">
                    {idx + 1}
                  </span>
                  <span className="break-all whitespace-pre-wrap">
                    {searchQuery ? highlightMatch(line, searchQuery) : line}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
