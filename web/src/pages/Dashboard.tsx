import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useContainerStore } from '../store/containers'
import { useStackStore } from '../store/stacks'
import { useSystemStore } from '../store/system'
import { useAuthStore } from '../store/auth'
import { useToastStore } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { api } from '../api/client'
import { Box, Layers, Image, HardDrive, Trash2 } from 'lucide-react'

export default function Dashboard() {
  const { containers, fetch: fetchContainers } = useContainerStore()
  const { stacks, fetch: fetchStacks } = useStackStore()
  const { info, fetch: fetchSystem } = useSystemStore()
  const { canWrite } = useAuthStore()
  const { addToast } = useToastStore()
  const [pruneConfirm, setPruneConfirm] = useState(false)
  const [pruning, setPruning] = useState(false)

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
    { label: 'Running Containers', count: runningCount, icon: Box, color: 'text-[var(--success)]' },
    { label: 'Stopped Containers', count: stoppedCount, icon: Box, color: 'text-[var(--danger)]' },
    { label: 'Images', count: imageCount, icon: Image, color: 'text-[var(--info)]' },
    { label: 'Stacks', count: stacks.length, icon: Layers, color: 'text-[var(--accent)]' },
  ]

  const handlePrune = async () => {
    setPruning(true)
    setPruneConfirm(false)
    try {
      await api.systemPrune()
      addToast('System pruned successfully', 'success')
      fetchSystem()
    } catch (err: any) {
      addToast('Prune failed: ' + err.message, 'error')
    }
    setPruning(false)
  }

  const recentContainers = containers.slice(0, 5)
  const recentStacks = stacks.slice(0, 5)

  return (
    <div className="space-y-8">
      <ConfirmDialog
        open={pruneConfirm}
        title="System Prune"
        message="This will remove all stopped containers, unused networks, dangling images, and unused volumes. This action cannot be undone."
        confirmLabel="Prune"
        confirmVariant="danger"
        onConfirm={handlePrune}
        onCancel={() => setPruneConfirm(false)}
      />

      {canWrite() && (
        <div className="flex justify-end">
          <button
            onClick={() => setPruneConfirm(true)}
            disabled={pruning}
            className="btn btn-danger"
          >
            <Trash2 size={14} />
            {pruning ? 'Pruning...' : 'System Prune'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="surface-raised flex items-start gap-4 p-4"
          >
            <card.icon size={24} className={card.color} />
            <div>
              <div className="text-3xl font-semibold tracking-tight">{card.count}</div>
              <div className="text-sm text-[var(--text-muted)]">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Recent Containers</h2>
          <Link to="/containers" className="text-sm text-[var(--primary)] hover:underline">
            View all
          </Link>
        </div>
        <div className="table-shell">
          <table className="w-full">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">State</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentContainers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--text-soft)]">
                    No containers
                  </td>
                </tr>
              ) : (
                recentContainers.map((c) => (
                  <tr key={c.ID} className="table-row">
                    <td className="px-4 py-3 text-sm">
                      <Link to={`/containers/${c.ID}`} className="text-[var(--primary)] hover:underline">
                        {c.Names.replace(/^\//, '')}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text)]">{c.Image}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`badge ${c.State === 'running' ? 'badge-success' : 'badge-danger'}`}>
                        {c.State}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{c.Status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Recent Stacks</h2>
          <Link to="/stacks" className="text-sm text-[var(--primary)] hover:underline">
            View all
          </Link>
        </div>
        <div className="table-shell">
          <table className="w-full">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Last Deployed</th>
              </tr>
            </thead>
            <tbody>
              {recentStacks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--text-soft)]">
                    No stacks
                  </td>
                </tr>
              ) : (
                recentStacks.map((s) => (
                  <tr key={s.ID} className="table-row">
                    <td className="px-4 py-3 text-sm">
                      <Link to={`/stacks?select=${s.ID}`} className="text-[var(--primary)] hover:underline">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{s.stackType}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`badge ${
                          s.lastStatus === 'success'
                            ? 'badge-success'
                            : s.lastStatus === 'failed'
                              ? 'badge-danger'
                              : 'badge-neutral'
                        }`}
                      >
                        {s.lastStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
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
