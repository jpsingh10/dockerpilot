import { useEffect, useState } from 'react'
import { useImageStore } from '../store/images'
import { useAuthStore } from '../store/auth'
import DataTable from '../components/DataTable'
import TableToolbar from '../components/TableToolbar'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToastStore } from '../components/Toast'
import { Trash2 } from 'lucide-react'
import type { Column } from '../components/DataTable'
import type { ImageInfo } from '../store/images'

export default function Images() {
  const { images, loading, fetch, remove, prune } = useImageStore()
  const { canWrite } = useAuthStore()
  const { addToast } = useToastStore()
  const [search, setSearch] = useState('')
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

  const filtered = images.filter(
    (img) => !search || img.Repository.toLowerCase().includes(search.toLowerCase())
  )

  const columns: Column<ImageInfo>[] = [
    {
      key: 'Repository',
      label: 'Repository',
      sortable: true,
      render: (img) => <span className="text-[var(--text)]">{img.Repository}</span>,
    },
    {
      key: 'Tag',
      label: 'Tag',
      sortable: true,
      render: (img) => (
        <span className="badge badge-neutral">
          {img.Tag}
        </span>
      ),
    },
    { key: 'Size', label: 'Size', sortable: true },
    { key: 'CreatedSince', label: 'Updated', sortable: true },
  ]

  if (canWrite()) {
    columns.push({
      key: 'actions',
      label: 'Actions',
      width: '80px',
      render: (img) => (
        <button
          onClick={() => confirmAction('Delete Image', `Are you sure you want to delete image ${img.Repository}:${img.Tag}?`, () => doAction(() => remove(img.ID), 'Image deleted successfully'))}
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
        title="Images"
        count={filtered.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search images..."
        onRefresh={fetch}
        onPrune={canWrite() ? () => confirmAction('Prune Images', 'Are you sure you want to remove all unused images? This cannot be undone.', () => doAction(prune, 'Unused images pruned successfully'), 'warning') : undefined}
      />
      <div className="table-shell">
        <DataTable
          columns={columns}
          data={filtered}
          keyField="ID"
          loading={loading}
          emptyMessage="No images found"
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
