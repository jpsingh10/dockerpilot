import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useContainerStore } from '../store/containers'
import { useAuthStore } from '../store/auth'
import DataTable from '../components/DataTable'
import TableToolbar from '../components/TableToolbar'
import StatusBadge from '../components/StatusBadge'
import { Play, Square, RotateCw, Trash2 } from 'lucide-react'
import type { Column } from '../components/DataTable'
import type { Container } from '../store/containers'

export default function Containers() {
  const { containers, loading, fetch, start, stop, restart, remove } = useContainerStore()
  const { canWrite } = useAuthStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<'all' | 'running' | 'stopped'>('all')

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, 10000)
    return () => clearInterval(interval)
  }, [fetch])

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

  const columns: Column<Container>[] = [
    {
      key: 'Names',
      label: 'Name',
      sortable: true,
      render: (c) => (
        <Link
          to={`/containers/${c.ID}`}
          className="text-blue-400 hover:text-blue-300 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {c.Names.replace(/^\//, '')}
        </Link>
      ),
    },
    { key: 'Image', label: 'Image', sortable: true },
    {
      key: 'State',
      label: 'State',
      sortable: true,
      render: (c) => <StatusBadge status={c.State} />,
    },
    { key: 'Status', label: 'Uptime', sortable: true },
    {
      key: 'Ports',
      label: 'Ports',
      render: (c) => (
        <span className="font-mono text-xs text-gray-400">{c.Ports || '-'}</span>
      ),
    },
  ]

  if (canWrite()) {
    columns.push({
      key: 'actions',
      label: 'Actions',
      width: '140px',
      render: (c) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {c.State !== 'running' ? (
            <button
              onClick={() => start(c.ID)}
              className="p-1.5 rounded hover:bg-gray-700 text-green-400"
              title="Start"
            >
              <Play size={14} />
            </button>
          ) : (
            <button
              onClick={() => stop(c.ID)}
              className="p-1.5 rounded hover:bg-gray-700 text-yellow-400"
              title="Stop"
            >
              <Square size={14} />
            </button>
          )}
          <button
            onClick={() => restart(c.ID)}
            className="p-1.5 rounded hover:bg-gray-700 text-blue-400"
            title="Restart"
          >
            <RotateCw size={14} />
          </button>
          <button
            onClick={() => remove(c.ID)}
            className="p-1.5 rounded hover:bg-gray-700 text-red-400"
            title="Remove"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    })
  }

  const filterDropdown = (
    <select
      value={stateFilter}
      onChange={(e) => setStateFilter(e.target.value as 'all' | 'running' | 'stopped')}
      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200"
    >
      <option value="all">All</option>
      <option value="running">Running</option>
      <option value="stopped">Stopped</option>
    </select>
  )

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
        extraButtons={filterDropdown}
      />
      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          keyField="ID"
          loading={loading}
          emptyMessage="No containers found"
        />
      </div>
    </div>
  )
}
