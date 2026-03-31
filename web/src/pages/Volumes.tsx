import { useEffect, useState } from 'react'
import { useVolumeStore } from '../store/volumes'
import { useAuthStore } from '../store/auth'
import DataTable from '../components/DataTable'
import TableToolbar from '../components/TableToolbar'
import { Trash2 } from 'lucide-react'
import type { Column } from '../components/DataTable'
import type { VolumeInfo } from '../store/volumes'

export default function Volumes() {
  const { volumes, loading, fetch, create, remove, prune } = useVolumeStore()
  const { canWrite } = useAuthStore()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDriver, setNewDriver] = useState('local')

  useEffect(() => {
    fetch()
  }, [fetch])

  const filtered = volumes.filter(
    (v) => !search || v.Name.toLowerCase().includes(search.toLowerCase())
  )

  const parseProject = (labels: string): string => {
    if (!labels) return '-'
    const match = labels.match(/com\.docker\.compose\.project=([^,]+)/)
    return match ? match[1] : '-'
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    await create({ name: newName.trim(), driver: newDriver })
    setNewName('')
    setNewDriver('local')
    setShowForm(false)
  }

  const columns: Column<VolumeInfo>[] = [
    {
      key: 'Name',
      label: 'Name',
      sortable: true,
      render: (v) => (
        <span className="max-w-xs truncate block text-gray-200" title={v.Name}>
          {v.Name}
        </span>
      ),
    },
    { key: 'Driver', label: 'Driver', sortable: true },
    { key: 'Scope', label: 'Scope', sortable: true },
    {
      key: 'Labels',
      label: 'Project',
      render: (v) => <span className="text-gray-400">{parseProject(v.Labels)}</span>,
    },
    { key: 'CreatedAt', label: 'Created', sortable: true },
  ]

  if (canWrite()) {
    columns.push({
      key: 'actions',
      label: 'Actions',
      width: '80px',
      render: (v) => (
        <button
          onClick={() => remove(v.Name)}
          className="p-1.5 rounded hover:bg-gray-700 text-red-400"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      ),
    })
  }

  return (
    <div>
      <TableToolbar
        title="Volumes"
        count={filtered.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search volumes..."
        onRefresh={fetch}
        onPrune={canWrite() ? prune : undefined}
        onCreate={canWrite() ? () => setShowForm(!showForm) : undefined}
      />
      {showForm && (
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 mb-4 flex gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Volume Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="my-volume"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Driver</label>
            <input
              value={newDriver}
              onChange={(e) => setNewDriver(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Create
          </button>
        </div>
      )}
      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          keyField="Name"
          loading={loading}
          emptyMessage="No volumes found"
        />
      </div>
    </div>
  )
}
