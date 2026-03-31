import { useEffect, useState } from 'react'
import { useImageStore } from '../store/images'
import { useAuthStore } from '../store/auth'
import DataTable from '../components/DataTable'
import TableToolbar from '../components/TableToolbar'
import { Trash2 } from 'lucide-react'
import type { Column } from '../components/DataTable'
import type { ImageInfo } from '../store/images'

export default function Images() {
  const { images, loading, fetch, remove, prune } = useImageStore()
  const { canWrite } = useAuthStore()
  const [search, setSearch] = useState('')

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
      render: (img) => <span className="text-gray-200">{img.Repository}</span>,
    },
    {
      key: 'Tag',
      label: 'Tag',
      sortable: true,
      render: (img) => (
        <span className="bg-blue-900/40 text-blue-400 rounded text-xs px-2 py-0.5">
          {img.Tag}
        </span>
      ),
    },
    { key: 'Size', label: 'Size', sortable: true },
    {
      key: 'CreatedSince',
      label: 'Updated',
      sortable: true,
    },
  ]

  if (canWrite()) {
    columns.push({
      key: 'actions',
      label: 'Actions',
      width: '80px',
      render: (img) => (
        <button
          onClick={() => remove(img.ID)}
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
        title="Images"
        count={filtered.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search images..."
        onRefresh={fetch}
        onPrune={canWrite() ? prune : undefined}
      />
      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          keyField="ID"
          loading={loading}
          emptyMessage="No images found"
        />
      </div>
    </div>
  )
}
