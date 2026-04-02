import { Search, RefreshCw, Trash2, Plus } from 'lucide-react'

interface TableToolbarProps {
  title: string
  count?: number
  searchValue: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  onRefresh?: () => void
  onPrune?: () => void
  onCreate?: () => void
  extraButtons?: React.ReactNode
}

export default function TableToolbar({
  title, count, searchValue, onSearchChange, searchPlaceholder = 'Search...',
  onRefresh, onPrune, onCreate, extraButtons,
}: TableToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {count !== undefined && (
          <span className="badge badge-neutral">{count}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="input w-64 pl-9 py-2"
          />
        </div>
        {extraButtons}
        {onRefresh && (
          <button onClick={onRefresh} className="btn btn-secondary">
            <RefreshCw size={14} /> Refresh
          </button>
        )}
        {onPrune && (
          <button onClick={onPrune} className="btn btn-secondary">
            <Trash2 size={14} /> Prune
          </button>
        )}
        {onCreate && (
          <button onClick={onCreate} className="btn btn-primary">
            <Plus size={14} /> Create
          </button>
        )}
      </div>
    </div>
  )
}
