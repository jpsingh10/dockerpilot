import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

export default function LogsTerminal({ logs }: { logs: string[] }) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const lastIndexRef = useRef(0)

  useEffect(() => {
    if (!terminalRef.current) return
    const cssVar = (name: string, fallback: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
    const terminal = new Terminal({
      theme: {
        background: cssVar('--surface', '#1a1f2b'),
        foreground: cssVar('--text', '#eef2f7'),
      },
      fontSize: 13,
      fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace",
      convertEol: true,
      disableStdin: true,
      scrollback: 5000,
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(terminalRef.current)
    fitAddon.fit()
    xtermRef.current = terminal
    fitRef.current = fitAddon
    const handleResize = () => fitAddon.fit()
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); terminal.dispose() }
  }, [])

  useEffect(() => {
    if (!xtermRef.current) return
    const newLogs = logs.slice(lastIndexRef.current)
    for (const line of newLogs) {
      xtermRef.current.writeln(line)
    }
    lastIndexRef.current = logs.length
  }, [logs])

  return <div ref={terminalRef} className="surface h-[400px] overflow-hidden" />
}
