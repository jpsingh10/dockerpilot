import { useEffect, useState } from 'react'
import { useNetworkStore } from '../store/networks'
import { useAuthStore } from '../store/auth'
import DataTable from '../components/DataTable'
import TableToolbar from '../components/TableToolbar'
import StatusBadge from '../components/StatusBadge'
import { Trash2 } from 'lucide-react'
import type { Column } from '../components/DataTable'
import type { NetworkInfo } from '../store/networks'

export default function Networks() {
  const { networks, loading, fetch, create, remove, prune } = useNetworkStore()
  const { canWrite } = useAuthStore()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDriver, setNewDriver] = useState('bridge')
  const [newSubnet, setNewSubnet] = useState('')
  const [newGateway, setNewGateway] = useState('')

  useEffect(() => {
    fetch()
  }, [fetch])

  const filtered = networks.filter(
    (n) => !search || n.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!newName.trim()) return
    await create({ name: newName.trim(), driver: newDriver, subnet: newSubnet, gateway: newGateway })
    setNewName('')
    setNewDriver('bridge')
    setNewSubnet('')
    setNewGateway('')
    setShowForm(false)
  }

  const columns: Column<NetworkInfo>[] = [
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'driver',
      label: 'Driver',
      sortable: true,
      render: (n) => <StatusBadge status={n.driver} />,
    },
    { key: 'scope', label: 'Scope', sortable: true },
    {
      key: 'subnet',
      label: 'Subnet',
      render: (n) => (
        <span className="font-mono text-xs text-gray-400">{n.subnet || '-'}</span>
      ),
    },
    {
      key: 'gateway',
      label: 'Gateway',
      render: (n) => (
        <span className="font-mono text-xs text-gray-400">{n.gateway || '-'}</span>
      ),
    },
    {
      key: 'containers',
      label: 'Containers',
      sortable: true,
      render: (n) => <span>{n.containers}</span>,
    },
  ]

  if (canWrite()) {
    columns.push({
      key: 'actions',
      label: 'Actions',
      width: '80px',
      render: (n) => (
        <button
          onClick={() => remove(n.id)}
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
        title="Networks"
        count={filtered.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search networks..."
        onRefresh={fetch}
        onPrune={canWrite() ? prune : undefined}
        onCreate={canWrite() ? () => setShowForm(!showForm) : undefined}
      />
      {showForm && (
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 mb-4 flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="my-network"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Driver</label>
            <select
              value={newDriver}
              onChange={(e) => setNewDriver(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="bridge">bridge</option>
              <option value="overlay">overlay</option>
              <option value="macvlan">macvlan</option>
              <option value="host">host</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Subnet</label>
            <input
              value={newSubnet}
              onChange={(e) => setNewSubnet(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="172.20.0.0/16"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Gateway</label>
            <input
              value={newGateway}
              onChange={(e) => setNewGateway(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="172.20.0.1"
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
          keyField="id"
          loading={loading}
          emptyMessage="No networks found"
        />
      </div>
    </div>
  )
}
