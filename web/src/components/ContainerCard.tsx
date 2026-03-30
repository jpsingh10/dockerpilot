import { Link } from 'react-router-dom'
import { Play, Square, RotateCw, Trash2 } from 'lucide-react'
import { Container, useContainerStore } from '../store/containers'

export default function ContainerCard({ container }: { container: Container }) {
  const { start, stop, restart, remove } = useContainerStore()
  const isRunning = container.State === 'running'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Link to={`/containers/${container.ID}`}
            className="text-white font-medium hover:text-blue-400 transition-colors">
            {container.Names}
          </Link>
          <p className="text-xs text-gray-500 mt-0.5">{container.ID.slice(0, 12)}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          isRunning ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-400'
        }`}>
          {container.State}
        </span>
      </div>
      <div className="text-sm text-gray-400 space-y-1 mb-4">
        <p>Image: <span className="text-gray-300">{container.Image}</span></p>
        <p>Status: <span className="text-gray-300">{container.Status}</span></p>
        {container.Ports && <p className="truncate">Ports: <span className="text-gray-300">{container.Ports}</span></p>}
      </div>
      <div className="flex gap-2">
        {!isRunning ? (
          <button onClick={() => start(container.ID)} className="flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 rounded-lg text-xs hover:bg-green-900/50">
            <Play size={12} /> Start
          </button>
        ) : (
          <button onClick={() => stop(container.ID)} className="flex items-center gap-1 px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded-lg text-xs hover:bg-yellow-900/50">
            <Square size={12} /> Stop
          </button>
        )}
        <button onClick={() => restart(container.ID)} className="flex items-center gap-1 px-2 py-1 bg-blue-900/30 text-blue-400 rounded-lg text-xs hover:bg-blue-900/50">
          <RotateCw size={12} /> Restart
        </button>
        <button onClick={() => remove(container.ID)} className="flex items-center gap-1 px-2 py-1 bg-red-900/30 text-red-400 rounded-lg text-xs hover:bg-red-900/50">
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </div>
  )
}
