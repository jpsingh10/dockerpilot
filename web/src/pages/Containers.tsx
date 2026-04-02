import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useContainerStore } from '../store/containers'
import { useAuthStore } from '../store/auth'
import { useToastStore } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable from '../components/DataTable'
import TableToolbar from '../components/TableToolbar'
import StatusBadge from '../components/StatusBadge'
import { FileText, Square, RotateCw, Trash2, StopCircle } from 'lucide-react'
import type { Column } from '../components/DataTable'
import type { Container } from '../store/containers'

export default function Containers() {
  const { containers, loading, fetch, start, stop, restart, remove, selected, toggleSelect, selectAll, clearSelection, bulkStop, bulkRemove } = useContainerStore()
  const { canWrite } = useAuthStore()
  const { addToast } = useToastStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<'all' | 'running' | 'stopped'>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Confirm dialog state
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; action: () => void; variant: 'danger' | 'warning' }>({
    open: false, title: '', message: '', action: () => {}, variant: 'danger',
  })

  useEffect(() => {
    fetch()
  }, [fetch])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetch, 10000)
    return () => clearInterval(interval)
  }, [fetch, autoRefresh])

  const filtered = containers.filter((c) => {
    const matchesSearch =
      !search ||
      c.Names.toLowerCase().includes(search.toLowerCase()) ||
      c.Image.toLowerCase().includes(search.toLowerCase())
    const matchesState =
      stateFilter === 'all' ||
      (stateFilter === 'running' && c.State === 'running') ||
      (stateFilter === 'stopped' && c.State !== 'running')
    return matchesSearch && matchesState
  })

  const confirmAction = useCallback((title: string, message: string, action: () => void, variant: 'danger' | 'warning' = 'danger') => {
    setConfirm({ open: true, title, message, action, variant })
  }, [])

  const doAction = useCallback(async (action: () => Promise<void>, successMsg: string) => {
    try {
      await action()
      addToast(successMsg, 'success')
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }, [addToast])

  const columns: Column<Container>[] = [
    {
      key: 'select',
      label: '',
      width: '40px',
        render: (c) => canWrite() ? (
          <input
            type="checkbox"
            checked={selected.has(c.ID)}
            onChange={() => toggleSelect(c.ID)}
            onClick={(e) => e.stopPropagation()}
            className="accent-[var(--primary)] rounded"
          />
        ) : null,
      },
    {
      key: 'Names',
      label: 'Name',
      sortable: true,
      render: (c) => (
        <Link
          to={`/containers/${c.ID}`}
          className="text-[var(--primary)] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {c.Names.replace(/^\//, '')}
        </Link>
      ),
    },
    {
      key: 'State',
      label: 'State',
      sortable: true,
      width: '90px',
      render: (c) => <StatusBadge status={c.State} />,
    },
    { key: 'Status', label: 'Uptime', sortable: true },
    {
      key: 'Restarts',
      label: 'Restarts',
      sortable: true,
      width: '80px',
      render: (c) => <span className="text-[var(--text-muted)]">{c.Restarts ?? '-'}</span>,
    },
    {
      key: 'CPUPerc',
      label: 'CPU',
      sortable: true,
      width: '70px',
      render: (c) => <span className="font-mono text-xs text-[var(--text-muted)]">{c.CPUPerc || '-'}</span>,
    },
    {
      key: 'MemUsage',
      label: 'Memory',
      width: '120px',
      render: (c) => <span className="font-mono text-xs text-[var(--text-muted)]">{c.MemUsage || '-'}</span>,
    },
    {
      key: 'NetIO',
      label: 'Net I/O',
      width: '120px',
      render: (c) => <span className="font-mono text-xs text-[var(--text-muted)]">{c.NetIO || '-'}</span>,
    },
    {
      key: 'BlockIO',
      label: 'Disk I/O',
      width: '120px',
      render: (c) => <span className="font-mono text-xs text-[var(--text-muted)]">{c.BlockIO || '-'}</span>,
    },
    {
      key: 'IPAddress',
      label: 'IP',
      width: '120px',
      render: (c) => <span className="font-mono text-xs text-[var(--text-muted)]">{c.IPAddress || '-'}</span>,
    },
    {
      key: 'Ports',
      label: 'Ports',
      render: (c) => (
        <span className="font-mono text-xs text-[var(--text-muted)]">{c.Ports || '-'}</span>
      ),
    },
    {
      key: 'Stack',
      label: 'Stack',
      sortable: true,
      width: '100px',
      render: (c) => c.Stack ? (
        <span className="text-xs text-[var(--accent)]">{c.Stack}</span>
      ) : <span className="text-[var(--text-soft)]">-</span>,
    },
  ]

  if (canWrite()) {
    columns.push({
      key: 'actions',
      label: 'Actions',
      width: '150px',
      render: (c) => (
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Link
            to={`/containers/${c.ID}`}
            className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--primary)]"
            title="Logs"
          >
            <FileText size={14} />
          </Link>
          {c.State === 'running' ? (
            <button
              onClick={() => confirmAction('Stop Container', `Stop "${c.Names.replace(/^\//, '')}"?`, () => doAction(() => stop(c.ID), 'Container stopped'), 'warning')}
              className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--warning)]"
              title="Stop"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              onClick={() => doAction(() => start(c.ID), 'Container started')}
              className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--success)]"
              title="Start"
            >
              <Square size={14} />
            </button>
          )}
            <button
              onClick={() => confirmAction('Restart Container', `Restart "${c.Names.replace(/^\//, '')}"?`, () => doAction(() => restart(c.ID), 'Container restarted'), 'warning')}
              className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--primary)]"
              title="Restart"
            >
              <RotateCw size={14} />
          </button>
            <button
              onClick={() => confirmAction('Remove Container', `Remove "${c.Names.replace(/^\//, '')}"? This cannot be undone.`, () => doAction(() => remove(c.ID), 'Container removed'))}
              className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--danger)]"
              title="Remove"
            >
              <Trash2 size={14} />
          </button>
        </div>
      ),
    })
  }

  const filterDropdown = (
    <div className="flex items-center gap-2">
      <select
        value={stateFilter}
        onChange={(e) => setStateFilter(e.target.value as 'all' | 'running' | 'stopped')}
        className="select w-auto px-3 py-1.5 text-sm"
      >
        <option value="all">All</option>
        <option value="running">Running</option>
        <option value="stopped">Stopped</option>
      </select>
      <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(e) => setAutoRefresh(e.target.checked)}
          className="accent-[var(--primary)] rounded"
        />
        Auto-refresh
      </label>
    </div>
  )

  const bulkButtons = selected.size > 0 ? (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--text-muted)]">{selected.size} selected</span>
      <button
        onClick={() => confirmAction('Bulk Stop', `Stop ${selected.size} containers?`, () => doAction(bulkStop, `${selected.size} containers stopped`), 'warning')}
        className="btn btn-secondary px-2 py-1 text-xs"
      >
        <StopCircle size={12} /> Stop
      </button>
      <button
        onClick={() => confirmAction('Bulk Remove', `Remove ${selected.size} containers? This cannot be undone.`, () => doAction(bulkRemove, `${selected.size} containers removed`))}
        className="btn btn-danger px-2 py-1 text-xs"
      >
        <Trash2 size={12} /> Remove
      </button>
      <button onClick={clearSelection} className="text-xs text-[var(--text-soft)] hover:text-[var(--text-muted)]">Clear</button>
    </div>
  ) : null

  return (
    <div>
      <TableToolbar
        title="Containers"
        count={filtered.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search containers..."
        onRefresh={fetch}
        onCreate={canWrite() ? () => navigate('/containers/new') : undefined}
        extraButtons={<>{filterDropdown}{bulkButtons}</>}
      />
      <div className="table-shell">
        <DataTable
          columns={columns}
          data={filtered}
          keyField="ID"
          loading={loading}
          emptyMessage="No containers found"
        />
      </div>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.variant === 'danger' ? 'Remove' : 'Confirm'}
        confirmVariant={confirm.variant}
        onConfirm={() => { confirm.action(); setConfirm(c => ({ ...c, open: false })) }}
        onCancel={() => setConfirm(c => ({ ...c, open: false }))}
      />
    </div>
  )
}
