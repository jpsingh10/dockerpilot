import { Link } from 'react-router-dom'
import { Play, Square, RotateCw, Trash2 } from 'lucide-react'
import { Container, useContainerStore } from '../store/containers'

export default function ContainerCard({ container }: { container: Container }) {
  const { start, stop, restart, remove } = useContainerStore()
  const isRunning = container.State === 'running'

  return (
    <div className="surface p-4 transition-colors hover:border-[var(--border-strong)]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Link to={`/containers/${container.ID}`}
            className="font-medium text-[var(--text)] transition-colors hover:text-[var(--primary)]">
            {container.Names}
          </Link>
          <p className="mt-0.5 text-xs text-[var(--text-soft)]">{container.ID.slice(0, 12)}</p>
        </div>
        <span className={`badge ${isRunning ? 'badge-success' : 'badge-neutral'}`}>
          {container.State}
        </span>
      </div>
      <div className="mb-4 space-y-1 text-sm text-[var(--text-muted)]">
        <p>Image: <span className="text-[var(--text)]">{container.Image}</span></p>
        <p>Status: <span className="text-[var(--text)]">{container.Status}</span></p>
        {container.Ports && <p className="truncate">Ports: <span className="text-[var(--text)]">{container.Ports}</span></p>}
      </div>
      <div className="flex gap-2">
        {!isRunning ? (
          <button onClick={() => start(container.ID)} className="btn btn-secondary px-2 py-1 text-xs">
            <Play size={12} /> Start
          </button>
        ) : (
          <button onClick={() => stop(container.ID)} className="btn btn-secondary px-2 py-1 text-xs">
            <Square size={12} /> Stop
          </button>
        )}
        <button onClick={() => restart(container.ID)} className="btn btn-secondary px-2 py-1 text-xs">
          <RotateCw size={12} /> Restart
        </button>
        <button onClick={() => remove(container.ID)} className="btn btn-danger px-2 py-1 text-xs">
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </div>
  )
}
