import { useEffect, useState } from 'react'
import { useVolumeStore } from '../store/volumes'
import { useAuthStore } from '../store/auth'
import DataTable from '../components/DataTable'
import TableToolbar from '../components/TableToolbar'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToastStore } from '../components/Toast'
import { Trash2 } from 'lucide-react'
import type { Column } from '../components/DataTable'
import type { VolumeInfo } from '../store/volumes'

export default function Volumes() {
  const { volumes, loading, fetch, create, remove, prune } = useVolumeStore()
  const { canWrite } = useAuthStore()
  const { addToast } = useToastStore()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDriver, setNewDriver] = useState('local')
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
        <span className="max-w-xs block truncate text-[var(--text)]" title={v.Name}>
          {v.Name}
        </span>
      ),
    },
    { key: 'Driver', label: 'Driver', sortable: true },
    { key: 'Scope', label: 'Scope', sortable: true },
    {
      key: 'Labels',
      label: 'Project',
      render: (v) => <span className="text-[var(--text-muted)]">{parseProject(v.Labels)}</span>,
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
          onClick={() => confirmAction('Delete Volume', `Are you sure you want to delete volume "${v.Name}"?`, () => doAction(() => remove(v.Name), 'Volume deleted successfully'))}
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
        title="Volumes"
        count={filtered.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search volumes..."
        onRefresh={fetch}
        onPrune={canWrite() ? () => confirmAction('Prune Volumes', 'Are you sure you want to remove all unused volumes? This cannot be undone.', () => doAction(prune, 'Unused volumes pruned successfully'), 'warning') : undefined}
        onCreate={canWrite() ? () => setShowForm(!showForm) : undefined}
      />
      {showForm && (
        <div className="surface mb-4 flex items-end gap-4 p-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--text-muted)]">Volume Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input"
              placeholder="my-volume"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-muted)]">Driver</label>
            <input
              value={newDriver}
              onChange={(e) => setNewDriver(e.target.value)}
              className="input"
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
          keyField="Name"
          loading={loading}
          emptyMessage="No volumes found"
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
