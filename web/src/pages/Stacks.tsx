import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStackStore, Stack } from '../store/stacks'
import { useAuthStore } from '../store/auth'
import { useToastStore } from '../components/Toast'
import { api } from '../api/client'
import { Plus, X, Terminal, Trash2, PowerOff, Download, Upload } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
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

type ConfirmAction = 'deploy' | 'teardown' | 'delete' | null

export default function Stacks() {
  const { stacks, loading, fetch, create, remove } = useStackStore()
  const { canWrite } = useAuthStore()
  const { addToast } = useToastStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const [selected, setSelected] = useState<Stack | null>(null)
  const [composeContent, setComposeContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [editorLoading, setEditorLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [name, setName] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [composePath, setComposePath] = useState('docker-compose.yml')
  const [formError, setFormError] = useState('')

  // SSE deploy terminal state
  const [deployLogs, setDeployLogs] = useState<string[]>([])
  const [deploying, setDeploying] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Confirm dialog state
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

  const hasUnsavedChanges = composeContent !== originalContent
  const envVars = extractEnvVars(composeContent)

  useEffect(() => { fetch() }, [fetch])

  // Auto-select from URL query param
  useEffect(() => {
    const selectId = searchParams.get('select')
    if (selectId && stacks.length > 0 && !selected) {
      const id = parseInt(selectId, 10)
      const stack = stacks.find(s => s.ID === id)
      if (stack) {
        selectStack(stack)
        // Clean up the query param
        setSearchParams({}, { replace: true })
      }
    }
  }, [stacks, searchParams])

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [deployLogs])

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const selectStack = async (stack: Stack) => {
    setSelected(stack)
    setEditorLoading(true)
    setShowTerminal(false)
    setDeployLogs([])
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

  const startDeployStream = useCallback((stackId: number) => {
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setDeployLogs([])
    setDeploying(true)
    setShowTerminal(true)

    const token = localStorage.getItem('token')
    const url = `${api.deployStreamUrl(stackId)}?token=${token}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      setDeployLogs(prev => [...prev, event.data])
    }

    es.addEventListener('error', () => {
      // SSE connection closed (could be normal end-of-stream or actual error)
      es.close()
      eventSourceRef.current = null
      setDeploying(false)
      fetch()
    })

    es.addEventListener('done', (event) => {
      setDeployLogs(prev => [...prev, event.data || 'Deploy complete.'])
      es.close()
      eventSourceRef.current = null
      setDeploying(false)
      addToast('Stack deployed successfully', 'success')
      fetch()
    })

    es.addEventListener('fail', (event) => {
      setDeployLogs(prev => [...prev, `ERROR: ${event.data}`])
      es.close()
      eventSourceRef.current = null
      setDeploying(false)
      addToast('Deploy failed', 'error')
      fetch()
    })
  }, [fetch, addToast])

  const handleSaveAndApply = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await api.updateComposeFile(selected.ID, composeContent)
      setOriginalContent(composeContent)
      addToast('Compose file saved, starting deploy...', 'info')
      startDeployStream(selected.ID)
    } catch (err: any) {
      addToast('Error: ' + err.message, 'error')
    }
    setSaving(false)
  }

  const handleTeardown = async () => {
    if (!selected) return
    try {
      await api.teardownStack(selected.ID)
      addToast(`Stack "${selected.name}" torn down`, 'success')
      fetch()
    } catch (err: any) {
      addToast('Teardown failed: ' + err.message, 'error')
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    const stackName = selected.name
    try {
      await remove(selected.ID)
      addToast(`Stack "${stackName}" deleted`, 'success')
      setSelected(null)
      setComposeContent('')
      setOriginalContent('')
      setShowTerminal(false)
    } catch (err: any) {
      addToast('Delete failed: ' + err.message, 'error')
    }
  }

  const handleExport = () => {
    if (!selected || !composeContent) return
    const blob = new Blob([composeContent], { type: 'application/x-yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selected.name}-docker-compose.yml`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Compose file downloaded', 'success')
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.yml,.yaml'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        YAML.parse(text) // validate
        setComposeContent(text)
        addToast('Compose file imported — review and Save & Apply', 'info')
      } catch {
        addToast('Invalid YAML file', 'error')
      }
    }
    input.click()
  }

  const handleConfirm = () => {
    switch (confirmAction) {
      case 'deploy':
        handleSaveAndApply()
        break
      case 'teardown':
        handleTeardown()
        break
      case 'delete':
        handleDelete()
        break
    }
    setConfirmAction(null)
  }

  const confirmDialogConfig: Record<
    'deploy' | 'teardown' | 'delete',
    { title: string; message: string; confirmLabel: string; confirmVariant: 'danger' | 'warning' }
  > = {
    deploy: {
      title: 'Save & Apply Changes',
      message: `This will save the compose file and redeploy the stack "${selected?.name}". Running containers may be recreated.`,
      confirmLabel: 'Save & Apply',
      confirmVariant: 'warning',
    },
    teardown: {
      title: 'Teardown Stack',
      message: `This will stop and remove all containers, networks, and volumes for "${selected?.name}". The stack configuration will be preserved.`,
      confirmLabel: 'Teardown',
      confirmVariant: 'danger',
    },
    delete: {
      title: 'Delete Stack',
      message: `This will permanently delete the stack "${selected?.name}" and all its configuration. This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    },
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !repoUrl) { setFormError('Name and repo URL are required'); return }
    setFormError('')
    try {
      await create({ name, repoUrl, branch, composePath })
      setShowCreateForm(false)
      setName(''); setRepoUrl(''); setBranch('main'); setComposePath('docker-compose.yml')
      addToast('Stack created', 'success')
    } catch (err: any) {
      setFormError(err.message)
    }
  }

  const inputClass = 'w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#1f6feb] text-sm'

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 88px)' }}>
      {/* Confirm Dialog */}
      {confirmAction && (
        <ConfirmDialog
          open={true}
          title={confirmDialogConfig[confirmAction].title}
          message={confirmDialogConfig[confirmAction].message}
          confirmLabel={confirmDialogConfig[confirmAction].confirmLabel}
          confirmVariant={confirmDialogConfig[confirmAction].confirmVariant}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {showCreateForm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
          <form onSubmit={handleCreate} className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-4 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#e6edf3]">Add Stack</h3>
              <button type="button" onClick={() => setShowCreateForm(false)} className="text-[#8b949e] hover:text-[#e6edf3]">
                <X size={18} />
              </button>
            </div>
            {formError && <div className="bg-[#da3633]/20 text-[#f85149] px-4 py-2 rounded-lg text-sm">{formError}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#8b949e] mb-1">Stack Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="my-app" required />
              </div>
              <div>
                <label className="block text-sm text-[#8b949e] mb-1">Repository URL *</label>
                <input type="text" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} className={inputClass} placeholder="https://github.com/user/repo.git" required />
              </div>
              <div>
                <label className="block text-sm text-[#8b949e] mb-1">Branch</label>
                <input type="text" value={branch} onChange={e => setBranch(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-[#8b949e] mb-1">Compose File Path</label>
                <input type="text" value={composePath} onChange={e => setComposePath(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 bg-[#21262d] text-[#8b949e] rounded-lg text-sm hover:bg-[#30363d]">Cancel</button>
              <button type="submit" className="bg-[#238636] hover:bg-[#2ea043] text-white px-4 py-2 rounded-lg text-sm font-medium">Create Stack</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 border-r border-[#30363d] overflow-y-auto bg-[#010409] flex flex-col">
          <div className="p-3 border-b border-[#30363d]">
            <h3 className="text-sm font-medium text-[#8b949e] uppercase tracking-wider">Stacks</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {stacks.map(s => (
              <button key={s.ID} onClick={() => selectStack(s)}
                className={`w-full text-left px-3 py-2.5 text-sm border-b border-[#21262d] flex items-center justify-between ${
                  selected?.ID === s.ID
                    ? 'bg-[#1f6feb]/15 text-[#58a6ff] border-l-2 border-l-[#58a6ff]'
                    : 'text-[#8b949e] hover:bg-[#161b22]'
                }`}>
                <span className="truncate">{s.name}</span>
                <StatusBadge status={s.lastStatus} />
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreateForm(true)}
            className="w-full px-3 py-2.5 text-sm text-[#58a6ff] hover:bg-[#161b22] flex items-center gap-2 border-t border-[#30363d]">
            <Plus size={14} /> Add Stack
          </button>
        </div>

        {selected ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-4 py-2 border-b border-[#30363d] bg-[#161b22] flex items-center gap-4">
              <span className="text-sm font-medium text-[#e6edf3]">{selected.name}</span>
              <span className="text-xs text-[#484f58]">{selected.composePath}</span>
              {showTerminal && (
                <button
                  onClick={() => setShowTerminal(false)}
                  className="ml-auto text-xs text-[#8b949e] hover:text-[#e6edf3] flex items-center gap-1"
                >
                  <Terminal size={12} /> Hide Terminal
                </button>
              )}
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <div className={showTerminal ? 'flex-1 min-h-0' : 'flex-1'}>
                {editorLoading ? (
                  <div className="flex-1 flex items-center justify-center text-[#484f58] h-full">Loading...</div>
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
              {/* SSE Deploy Terminal */}
              {showTerminal && (
                <div className="border-t border-[#30363d]" style={{ height: '220px' }}>
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#30363d]">
                    <div className="flex items-center gap-2">
                      <Terminal size={13} className="text-[#8b949e]" />
                      <span className="text-xs font-medium text-[#8b949e]">Deploy Output</span>
                      {deploying && (
                        <span className="flex items-center gap-1 text-xs text-[#d29922]">
                          <span className="w-1.5 h-1.5 bg-[#d29922] rounded-full animate-pulse" />
                          Running
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowTerminal(false)}
                      className="text-[#484f58] hover:text-[#e6edf3]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div
                    ref={terminalRef}
                    className="overflow-y-auto font-mono text-xs leading-5 p-3"
                    style={{
                      height: 'calc(100% - 32px)',
                      backgroundColor: '#0d1117',
                      color: '#e6edf3',
                    }}
                  >
                    {deployLogs.length === 0 && !deploying && (
                      <span className="text-[#484f58]">No output yet.</span>
                    )}
                    {deployLogs.map((line, i) => (
                      <div key={i} className={line.startsWith('ERROR') ? 'text-[#f85149]' : ''}>
                        {line}
                      </div>
                    ))}
                    {deploying && deployLogs.length > 0 && (
                      <span className="text-[#484f58] animate-pulse">_</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#484f58]">
            {loading ? 'Loading stacks...' : stacks.length === 0 ? 'No stacks configured. Click "Add Stack" to get started.' : 'Select a stack to edit its compose file'}
          </div>
        )}

        <div className="w-80 border-l border-[#30363d] bg-[#010409] overflow-y-auto">
          <div className="p-3 border-b border-[#30363d]">
            <h3 className="text-sm font-medium text-[#8b949e]">Environment Variables</h3>
          </div>
          <div className="p-3">
            {Object.entries(envVars).map(([service, vars]) => (
              <div key={service} className="mb-4">
                <h4 className="text-xs font-semibold text-[#58a6ff] uppercase mb-2">{service}</h4>
                <div className="space-y-1">
                  {Object.entries(vars).map(([key, value]) => (
                    <div key={key} className="flex text-xs">
                      <span className="text-[#3fb950] font-mono w-1/2 truncate">{key}</span>
                      <span className="text-[#8b949e] font-mono w-1/2 truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(envVars).length === 0 && (
              <p className="text-xs text-[#484f58]">No environment variables found</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-[#30363d] bg-[#161b22]">
        <span className="text-xs text-[#484f58]">
          {hasUnsavedChanges ? 'Unsaved changes' : 'No changes'}
        </span>
        <div className="flex gap-2">
          {canWrite() && selected && (
            <>
              <button
                onClick={() => setConfirmAction('teardown')}
                className="px-3 py-1.5 bg-[#21262d] text-[#d29922] rounded-lg text-sm hover:bg-[#30363d] flex items-center gap-1.5"
              >
                <PowerOff size={13} /> Teardown
              </button>
              <button
                onClick={() => setConfirmAction('delete')}
                className="px-3 py-1.5 bg-[#21262d] text-[#f85149] rounded-lg text-sm hover:bg-[#30363d] flex items-center gap-1.5"
              >
                <Trash2 size={13} /> Delete
              </button>
            </>
          )}
          {selected && (
            <>
              <button onClick={handleExport}
                className="px-3 py-1.5 bg-[#21262d] text-[#8b949e] rounded-lg text-sm hover:bg-[#30363d] flex items-center gap-1.5"
                title="Export compose file">
                <Download size={13} /> Export
              </button>
              <button onClick={handleImport}
                className="px-3 py-1.5 bg-[#21262d] text-[#8b949e] rounded-lg text-sm hover:bg-[#30363d] flex items-center gap-1.5"
                title="Import compose file">
                <Upload size={13} /> Import
              </button>
            </>
          )}
          <button onClick={handleCancel} disabled={!hasUnsavedChanges}
            className="px-3 py-1.5 bg-[#21262d] text-[#8b949e] rounded-lg text-sm hover:bg-[#30363d] disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => setShowCreateForm(true)}
            className="px-3 py-1.5 bg-[#21262d] text-[#8b949e] rounded-lg text-sm hover:bg-[#30363d]">
            New
          </button>
          {canWrite() && (
            <button onClick={() => setConfirmAction('deploy')} disabled={!hasUnsavedChanges || saving || deploying}
              className="px-3 py-1.5 bg-[#238636] text-white rounded-lg text-sm hover:bg-[#2ea043] disabled:opacity-50 flex items-center gap-1">
              {saving ? 'Saving...' : deploying ? 'Deploying...' : 'Save & Apply'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
