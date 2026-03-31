import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useContainerStore } from '../store/containers'
import { useStackStore } from '../store/stacks'
import { useSystemStore } from '../store/system'
import { Box, Layers, Image, HardDrive } from 'lucide-react'

export default function Dashboard() {
  const { containers, fetch: fetchContainers } = useContainerStore()
  const { stacks, fetch: fetchStacks } = useStackStore()
  const { info, fetch: fetchSystem } = useSystemStore()

  useEffect(() => {
    fetchContainers()
    fetchStacks()
    fetchSystem()
    const interval = setInterval(fetchContainers, 10000)
    return () => clearInterval(interval)
  }, [fetchContainers, fetchStacks, fetchSystem])

  const runningCount = info?.ContainersRunning ?? containers.filter((c) => c.State === 'running').length
  const stoppedCount = info?.ContainersStopped ?? containers.filter((c) => c.State !== 'running').length
  const imageCount = info?.Images ?? 0

  const cards = [
    { label: 'Running Containers', count: runningCount, icon: Box, color: 'text-green-400' },
    { label: 'Stopped Containers', count: stoppedCount, icon: Box, color: 'text-red-400' },
    { label: 'Images', count: imageCount, icon: Image, color: 'text-blue-400' },
    { label: 'Stacks', count: stacks.length, icon: Layers, color: 'text-purple-400' },
  ]

  const recentContainers = containers.slice(0, 5)
  const recentStacks = stacks.slice(0, 5)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-[#111827] border border-gray-800 rounded-xl p-5 flex items-start gap-4"
          >
            <card.icon size={24} className={card.color} />
            <div>
              <div className="text-3xl font-bold text-white">{card.count}</div>
              <div className="text-sm text-gray-400">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Recent Containers</h2>
          <Link to="/containers" className="text-sm text-blue-400 hover:text-blue-300">
            View all
          </Link>
        </div>
        <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0d1525]">
                <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">Name</th>
                <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">Image</th>
                <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">State</th>
                <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentContainers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    No containers
                  </td>
                </tr>
              ) : (
                recentContainers.map((c) => (
                  <tr key={c.ID} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm">
                      <Link to={`/containers/${c.ID}`} className="text-blue-400 hover:text-blue-300">
                        {c.Names.replace(/^\//, '')}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{c.Image}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.State === 'running'
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-red-900/50 text-red-400'
                        }`}
                      >
                        {c.State}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{c.Status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Recent Stacks</h2>
          <Link to="/stacks" className="text-sm text-blue-400 hover:text-blue-300">
            View all
          </Link>
        </div>
        <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0d1525]">
                <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">Name</th>
                <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">Type</th>
                <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">Status</th>
                <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">Last Deployed</th>
              </tr>
            </thead>
            <tbody>
              {recentStacks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    No stacks
                  </td>
                </tr>
              ) : (
                recentStacks.map((s) => (
                  <tr key={s.ID} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm text-gray-200">{s.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{s.stackType}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.lastStatus === 'success'
                            ? 'bg-green-900/50 text-green-400'
                            : s.lastStatus === 'failed'
                            ? 'bg-red-900/50 text-red-400'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {s.lastStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {s.lastDeployedAt || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
