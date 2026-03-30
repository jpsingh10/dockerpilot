import { Rocket, Trash2, XCircle, GitBranch, FolderOpen } from 'lucide-react'
import { Stack, useStackStore } from '../store/stacks'

const statusColors: Record<string, string> = {
  success: 'bg-green-900/50 text-green-400',
  failed: 'bg-red-900/50 text-red-400',
  pending: 'bg-yellow-900/50 text-yellow-400',
}

export default function StackCard({ stack }: { stack: Stack }) {
  const { deploy, teardown, remove } = useStackStore()
  const isLocal = stack.stackType === 'local'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-medium">{stack.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            {isLocal ? (
              <span className="flex items-center gap-1 text-xs text-purple-400">
                <FolderOpen size={12} /> Local
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-blue-400">
                <GitBranch size={12} /> {stack.branch}
              </span>
            )}
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[stack.lastStatus] || statusColors.pending}`}>
          {stack.lastStatus}
        </span>
      </div>
      <div className="text-sm text-gray-400 space-y-1 mb-4">
        {isLocal ? (
          <p className="truncate">Path: <span className="text-gray-300">{stack.localPath}</span></p>
        ) : (
          <p className="truncate">Repo: <span className="text-gray-300">{stack.repoUrl}</span></p>
        )}
        <p>Compose: <span className="text-gray-300">{stack.composePath}</span></p>
        {stack.lastCommit && <p>Commit: <span className="text-gray-300 font-mono">{stack.lastCommit.slice(0, 7)}</span></p>}
        {stack.lastDeployedAt && <p>Deployed: <span className="text-gray-300">{new Date(stack.lastDeployedAt).toLocaleString()}</span></p>}
      </div>
      <div className="flex gap-2">
        <button onClick={() => deploy(stack.ID)} className="flex items-center gap-1 px-2 py-1 bg-blue-900/30 text-blue-400 rounded-lg text-xs hover:bg-blue-900/50">
          <Rocket size={12} /> Deploy
        </button>
        <button onClick={() => teardown(stack.ID)} className="flex items-center gap-1 px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded-lg text-xs hover:bg-yellow-900/50">
          <XCircle size={12} /> Teardown
        </button>
        <button onClick={() => remove(stack.ID)} className="flex items-center gap-1 px-2 py-1 bg-red-900/30 text-red-400 rounded-lg text-xs hover:bg-red-900/50">
          <Trash2 size={12} /> Delete
        </button>
      </div>
      {!isLocal && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <p className="text-xs text-gray-500">Webhook: <code className="text-gray-400">/api/v1/webhooks/{stack.webhookId}</code></p>
        </div>
      )}
    </div>
  )
}
