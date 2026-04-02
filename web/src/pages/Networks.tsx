import { useEffect, useState } from 'react'
import { useNetworkStore } from '../store/networks'
import { useAuthStore } from '../store/auth'
import DataTable from '../components/DataTable'
import TableToolbar from '../components/TableToolbar'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToastStore } from '../components/Toast'
import { Trash2 } from 'lucide-react'
import type { Column } from '../components/DataTable'
import type { NetworkInfo } from '../store/networks'

export default function Networks() {
  const { networks, loading, fetch, create, remove, prune } = useNetworkStore()
  const { canWrite } = useAuthStore()
  const { addToast } = useToastStore()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDriver, setNewDriver] = useState('bridge')
  const [newSubnet, setNewSubnet] = useState('')
  const [newGateway, setNewGateway] = useState('')
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; action: () => void; variant: 'danger' | 'warning' }>({
    open: false, title: '', message: '', action: () => {}, variant: 'danger',
  })

  const confirmAction = (title: string, message: string, action: () => void, variant: 'danger' | 'warning' = 'danger') => {
    setConfirm({ open: true, title, message, action, variant })
  }

  const doAction = async (action: () => Promise<void>, successMsg: string) => {
    try {
      await action()
      addToast(successMsg, 'success')
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

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
        <span className="font-mono text-xs text-[var(--text-muted)]">{n.subnet || '-'}</span>
      ),
    },
    {
      key: 'gateway',
      label: 'Gateway',
      render: (n) => (
        <span className="font-mono text-xs text-[var(--text-muted)]">{n.gateway || '-'}</span>
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
          onClick={() => confirmAction('Delete Network', `Are you sure you want to delete network "${n.name}"?`, () => doAction(() => remove(n.id), 'Network deleted successfully'))}
          className="rounded p-1.5 text-[var(--danger)] hover:bg-[var(--bg-elevated)]"
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
        onPrune={canWrite() ? () => confirmAction('Prune Networks', 'Are you sure you want to remove all unused networks? This cannot be undone.', () => doAction(prune, 'Unused networks pruned successfully'), 'warning') : undefined}
        onCreate={canWrite() ? () => setShowForm(!showForm) : undefined}
      />
      {showForm && (
        <div className="surface mb-4 flex flex-wrap items-end gap-4 p-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--text-muted)]">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input"
              placeholder="my-network"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-muted)]">Driver</label>
            <select
              value={newDriver}
              onChange={(e) => setNewDriver(e.target.value)}
              className="select"
            >
              <option value="bridge">bridge</option>
              <option value="overlay">overlay</option>
              <option value="macvlan">macvlan</option>
              <option value="host">host</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-muted)]">Subnet</label>
            <input
              value={newSubnet}
              onChange={(e) => setNewSubnet(e.target.value)}
              className="input"
              placeholder="172.20.0.0/16"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-muted)]">Gateway</label>
            <input
              value={newGateway}
              onChange={(e) => setNewGateway(e.target.value)}
              className="input"
              placeholder="172.20.0.1"
            />
          </div>
          <button
            onClick={handleCreate}
            className="btn btn-primary"
          >
            Create
          </button>
        </div>
      )}
      <div className="table-shell">
        <DataTable
          columns={columns}
          data={filtered}
          keyField="id"
          loading={loading}
          emptyMessage="No networks found"
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
