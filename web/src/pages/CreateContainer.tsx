import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { Plus, Minus } from 'lucide-react'

export default function CreateContainer() {
  const navigate = useNavigate()
  const [image, setImage] = useState('')
  const [name, setName] = useState('')
  const [forcePull, setForcePull] = useState(false)
  const [cpuLimit, setCpuLimit] = useState('')
  const [memoryLimit, setMemoryLimit] = useState('')
  const [ports, setPorts] = useState<string[]>([''])
  const [volumes, setVolumes] = useState<string[]>([''])
  const [envVars, setEnvVars] = useState<string[]>([''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const addField = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter(prev => [...prev, ''])
  const removeField = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number) =>
    setter(prev => prev.filter((_, i) => i !== idx))
  const updateField = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number, val: string) =>
    setter(prev => prev.map((v, i) => (i === idx ? val : v)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!image) { setError('Image is required'); return }
    setError('')
    setLoading(true)
    try {
      await api.createContainer({
        image, name, forcePull,
        ports: ports.filter(p => p.trim()),
        volumes: volumes.filter(v => v.trim()),
        env: envVars.filter(e => e.trim()),
        cpuLimit: cpuLimit.trim() || undefined,
        memoryLimit: memoryLimit.trim() || undefined,
      })
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'input text-sm'

  return (
    <div className="max-w-2xl">
      <h2 className="mb-6 text-lg font-semibold tracking-tight">Create Container</h2>
      <form onSubmit={handleSubmit} className="surface space-y-5 p-6">
        {error && <div className="badge badge-danger w-full justify-start px-3 py-2 text-sm">{error}</div>}
        <div>
          <label className="mb-1 block text-sm text-[var(--text-muted)]">Image *</label>
          <input type="text" value={image} onChange={e => setImage(e.target.value)} className={inputClass} placeholder="nginx:latest" required />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--text-muted)]">Container Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="my-container" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="forcePull" checked={forcePull} onChange={e => setForcePull(e.target.checked)} className="rounded border-[var(--border)] bg-[var(--surface)]" />
          <label htmlFor="forcePull" className="text-sm text-[var(--text-muted)]">Force re-pull image</label>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--text-muted)]">CPU Limit</label>
          <input type="text" value={cpuLimit} onChange={e => setCpuLimit(e.target.value)} className={inputClass} placeholder="e.g. 0.5, 1, 2" />
          <p className="mt-1 text-xs text-[var(--text-soft)]">Number of CPUs (e.g., 0.5 = half a core)</p>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--text-muted)]">Memory Limit</label>
          <input type="text" value={memoryLimit} onChange={e => setMemoryLimit(e.target.value)} className={inputClass} placeholder="e.g. 256m, 1g" />
          <p className="mt-1 text-xs text-[var(--text-soft)]">Memory limit (e.g., 256m, 1g, 2g)</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-[var(--text-muted)]">Port Mappings</label>
            <button type="button" onClick={() => addField(setPorts)} className="text-[var(--primary)] hover:opacity-80"><Plus size={16} /></button>
          </div>
          {ports.map((p, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" value={p} onChange={e => updateField(setPorts, i, e.target.value)} className={inputClass} placeholder="8080:80" />
              {ports.length > 1 && <button type="button" onClick={() => removeField(setPorts, i)} className="text-[var(--danger)] hover:opacity-80"><Minus size={16} /></button>}
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-[var(--text-muted)]">Volume Mounts</label>
            <button type="button" onClick={() => addField(setVolumes)} className="text-[var(--primary)] hover:opacity-80"><Plus size={16} /></button>
          </div>
          {volumes.map((v, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" value={v} onChange={e => updateField(setVolumes, i, e.target.value)} className={inputClass} placeholder="/host/path:/container/path" />
              {volumes.length > 1 && <button type="button" onClick={() => removeField(setVolumes, i)} className="text-[var(--danger)] hover:opacity-80"><Minus size={16} /></button>}
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-[var(--text-muted)]">Environment Variables</label>
            <button type="button" onClick={() => addField(setEnvVars)} className="text-[var(--primary)] hover:opacity-80"><Plus size={16} /></button>
          </div>
          {envVars.map((e, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" value={e} onChange={ev => updateField(setEnvVars, i, ev.target.value)} className={inputClass} placeholder="KEY=VALUE" />
              {envVars.length > 1 && <button type="button" onClick={() => removeField(setEnvVars, i)} className="text-[var(--danger)] hover:opacity-80"><Minus size={16} /></button>}
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Creating...' : 'Create Container'}
          </button>
          <button type="button" onClick={() => navigate('/')} className="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  )
}
