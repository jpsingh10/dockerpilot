import { Rocket, Trash2, XCircle, GitBranch, FolderOpen } from 'lucide-react'
import { Stack, useStackStore } from '../store/stacks'

const statusColors: Record<string, string> = {
  success: 'badge-success',
  failed: 'badge-danger',
  pending: 'badge-warning',
}

export default function StackCard({ stack }: { stack: Stack }) {
  const { deploy, teardown, remove } = useStackStore()
  const isLocal = stack.stackType === 'local'

  return (
    <div className="surface p-4 transition-colors hover:border-[var(--border-strong)]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-[var(--text)]">{stack.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            {isLocal ? (
              <span className="flex items-center gap-1 text-xs text-[var(--accent)]">
                <FolderOpen size={12} /> Local
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-[var(--primary)]">
                <GitBranch size={12} /> {stack.branch}
              </span>
            )}
          </div>
        </div>
        <span className={`badge ${statusColors[stack.lastStatus] || statusColors.pending}`}>
          {stack.lastStatus}
        </span>
      </div>
      <div className="mb-4 space-y-1 text-sm text-[var(--text-muted)]">
        {isLocal ? (
          <p className="truncate">Path: <span className="text-[var(--text)]">{stack.localPath}</span></p>
        ) : (
          <p className="truncate">Repo: <span className="text-[var(--text)]">{stack.repoUrl}</span></p>
        )}
        <p>Compose: <span className="text-[var(--text)]">{stack.composePath}</span></p>
        {stack.lastCommit && <p>Commit: <span className="font-mono text-[var(--text)]">{stack.lastCommit.slice(0, 7)}</span></p>}
        {stack.lastDeployedAt && <p>Deployed: <span className="text-[var(--text)]">{new Date(stack.lastDeployedAt).toLocaleString()}</span></p>}
      </div>
      <div className="flex gap-2">
        <button onClick={() => deploy(stack.ID)} className="btn btn-secondary px-2 py-1 text-xs">
          <Rocket size={12} /> Deploy
        </button>
        <button onClick={() => teardown(stack.ID)} className="btn btn-secondary px-2 py-1 text-xs">
          <XCircle size={12} /> Teardown
        </button>
        <button onClick={() => remove(stack.ID)} className="btn btn-danger px-2 py-1 text-xs">
          <Trash2 size={12} /> Delete
        </button>
      </div>
      {!isLocal && (
        <div className="mt-3 border-t border-[var(--border)] pt-3">
          <p className="text-xs text-[var(--text-soft)]">Webhook: <code className="text-[var(--text-muted)]">/api/v1/webhooks/{stack.webhookId}</code></p>
        </div>
      )}
    </div>
  )
}
