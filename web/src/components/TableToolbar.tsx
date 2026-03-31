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
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {count !== undefined && (
          <span className="bg-gray-700 text-gray-300 px-2 rounded-full text-xs">{count}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-gray-200 w-64 focus:outline-none focus:border-gray-600"
          />
        </div>
        {extraButtons}
        {onRefresh && (
          <button onClick={onRefresh} className="bg-gray-800 text-gray-300 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5">
            <RefreshCw size={14} /> Refresh
          </button>
        )}
        {onPrune && (
          <button onClick={onPrune} className="bg-gray-800 text-gray-300 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5">
            <Trash2 size={14} /> Prune
          </button>
        )}
        {onCreate && (
          <button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5">
            <Plus size={14} /> Create
          </button>
        )}
      </div>
    </div>
  )
}
