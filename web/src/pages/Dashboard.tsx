import { useEffect } from 'react'
import { useContainerStore } from '../store/containers'
import { useStackStore } from '../store/stacks'
import ContainerCard from '../components/ContainerCard'
import StackCard from '../components/StackCard'
import { RefreshCw } from 'lucide-react'

export default function Dashboard() {
  const { containers, loading: cLoading, fetch: fetchContainers } = useContainerStore()
  const { stacks, loading: sLoading, fetch: fetchStacks } = useStackStore()

  useEffect(() => {
    fetchContainers()
    fetchStacks()
    const interval = setInterval(() => { fetchContainers() }, 10000)
    return () => clearInterval(interval)
  }, [fetchContainers, fetchStacks])

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Containers <span className="text-gray-500 text-sm font-normal">({containers.length})</span>
          </h2>
          <button onClick={fetchContainers} disabled={cLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50">
            <RefreshCw size={14} className={cLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
        {containers.length === 0 && !cLoading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400">No containers found</p>
            <p className="text-gray-500 text-sm mt-1">Create a container or start Docker</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {containers.map(c => <ContainerCard key={c.ID} container={c} />)}
          </div>
        )}
      </section>
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Stacks <span className="text-gray-500 text-sm font-normal">({stacks.length})</span>
          </h2>
          <button onClick={fetchStacks} disabled={sLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50">
            <RefreshCw size={14} className={sLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
        {stacks.length === 0 && !sLoading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400">No stacks configured</p>
            <p className="text-gray-500 text-sm mt-1">Add a stack from the Stacks page</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stacks.map(s => <StackCard key={s.ID} stack={s} />)}
          </div>
        )}
      </section>
    </div>
  )
}
