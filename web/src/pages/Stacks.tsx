import { useEffect, useState } from 'react'
import { useStackStore, Stack } from '../store/stacks'
import { useAuthStore } from '../store/auth'
import { api } from '../api/client'
import { Plus, X } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import Editor from '@monaco-editor/react'
import YAML from 'yaml'

function extractEnvVars(yamlContent: string): Record<string, Record<string, string>> {
  try {
    const doc = YAML.parse(yamlContent)
    const result: Record<string, Record<string, string>> = {}
    if (doc?.services) {
      for (const [svcName, svc] of Object.entries(doc.services)) {
        const env = (svc as any)?.environment
        if (env) {
          if (Array.isArray(env)) {
            result[svcName] = Object.fromEntries(
              env.map((e: string) => {
                const idx = e.indexOf('=')
                return idx > -1 ? [e.slice(0, idx), e.slice(idx + 1)] : [e, '']
              })
            )
          } else if (typeof env === 'object') {
            result[svcName] = Object.fromEntries(
              Object.entries(env).map(([k, v]) => [k, String(v)])
            )
          }
        }
      }
    }
    return result
  } catch {
    return {}
  }
}

export default function Stacks() {
  const { stacks, loading, fetch, create } = useStackStore()
  const { canWrite } = useAuthStore()

  const [selected, setSelected] = useState<Stack | null>(null)
  const [composeContent, setComposeContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [editorLoading, setEditorLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Create form state
  const [name, setName] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [composePath, setComposePath] = useState('docker-compose.yml')
  const [formError, setFormError] = useState('')

  const hasUnsavedChanges = composeContent !== originalContent
  const envVars = extractEnvVars(composeContent)

  useEffect(() => { fetch() }, [fetch])

  const selectStack = async (stack: Stack) => {
    setSelected(stack)
    setEditorLoading(true)
    try {
      const { content } = await api.getComposeFile(stack.ID)
      setComposeContent(content)
      setOriginalContent(content)
    } catch (err: any) {
      setComposeContent('# Error loading compose file: ' + err.message)
      setOriginalContent('')
    }
    setEditorLoading(false)
  }

  const handleCancel = () => {
    setComposeContent(originalContent)
  }

  const handleSaveAndApply = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await api.updateComposeFile(selected.ID, composeContent)
      setOriginalContent(composeContent)
      await api.deployStack(selected.ID)
      fetch()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setSaving(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !repoUrl) { setFormError('Name and repo URL are required'); return }
    setFormError('')
    try {
      await create({ name, repoUrl, branch, composePath })
      setShowCreateForm(false)
      setName(''); setRepoUrl(''); setBranch('main'); setComposePath('docker-compose.yml')
    } catch (err: any) {
      setFormError(err.message)
    }
  }

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 88px)' }}>
      {/* Create Stack Modal */}
      {showCreateForm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
          <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Add Stack</h3>
              <button type="button" onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            {formError && <div className="bg-red-900/50 text-red-300 px-4 py-2 rounded-lg text-sm">{formError}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Stack Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="my-app" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Repository URL *</label>
                <input type="text" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} className={inputClass} placeholder="https://github.com/user/repo.git" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Branch</label>
                <input type="text" value={branch} onChange={e => setBranch(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Compose File Path</label>
                <input type="text" value={composePath} onChange={e => setComposePath(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Create Stack</button>
            </div>
          </form>
        </div>
      )}

      {/* Main split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Stack List */}
        <div className="w-56 border-r border-gray-800 overflow-y-auto bg-[#0d1525] flex flex-col">
          <div className="p-3 border-b border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Stacks</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {stacks.map(s => (
              <button key={s.ID} onClick={() => selectStack(s)}
                className={`w-full text-left px-3 py-2.5 text-sm border-b border-gray-800/50 flex items-center justify-between ${
                  selected?.ID === s.ID
                    ? 'bg-blue-600/20 text-blue-400 border-l-2 border-l-blue-400'
                    : 'text-gray-400 hover:bg-gray-800/50'
                }`}>
                <span className="truncate">{s.name}</span>
                <StatusBadge status={s.lastStatus} />
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreateForm(true)}
            className="w-full px-3 py-2.5 text-sm text-blue-400 hover:bg-gray-800/50 flex items-center gap-2 border-t border-gray-800">
            <Plus size={14} /> Add Stack
          </button>
        </div>

        {/* Center panel - Monaco Editor */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-4 py-2 border-b border-gray-800 bg-[#0d1525] flex items-center gap-4">
              <span className="text-sm font-medium text-white">{selected.name}</span>
              <span className="text-xs text-gray-500">{selected.composePath}</span>
            </div>
            {editorLoading ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">Loading...</div>
            ) : (
              <Editor
                height="100%"
                language="yaml"
                theme="vs-dark"
                value={composeContent}
                onChange={(value) => setComposeContent(value || '')}
                options={{
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  fontSize: 13,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            {loading ? 'Loading stacks...' : stacks.length === 0 ? 'No stacks configured. Click "Add Stack" to get started.' : 'Select a stack to edit its compose file'}
          </div>
        )}

        {/* Right panel - Environment Variables */}
        <div className="w-80 border-l border-gray-800 bg-[#0d1525] overflow-y-auto">
          <div className="p-3 border-b border-gray-800">
            <h3 className="text-sm font-medium text-gray-400">Environment Variables</h3>
          </div>
          <div className="p-3">
            {Object.entries(envVars).map(([service, vars]) => (
              <div key={service} className="mb-4">
                <h4 className="text-xs font-semibold text-blue-400 uppercase mb-2">{service}</h4>
                <div className="space-y-1">
                  {Object.entries(vars).map(([key, value]) => (
                    <div key={key} className="flex text-xs">
                      <span className="text-green-400 font-mono w-1/2 truncate">{key}</span>
                      <span className="text-gray-400 font-mono w-1/2 truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(envVars).length === 0 && (
              <p className="text-xs text-gray-500">No environment variables found</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-[#0d1525]">
        <span className="text-xs text-gray-500">
          {hasUnsavedChanges ? 'Unsaved changes' : 'No changes'}
        </span>
        <div className="flex gap-2">
          <button onClick={handleCancel} disabled={!hasUnsavedChanges}
            className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => setShowCreateForm(true)}
            className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">
            New
          </button>
          {canWrite() && (
            <button onClick={handleSaveAndApply} disabled={!hasUnsavedChanges || saving}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
              {saving ? 'Saving...' : 'Save & Apply'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
