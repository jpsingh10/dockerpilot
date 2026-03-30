import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { Plus, Minus } from 'lucide-react'

export default function CreateContainer() {
  const navigate = useNavigate()
  const [image, setImage] = useState('')
  const [name, setName] = useState('')
  const [forcePull, setForcePull] = useState(false)
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
      })
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-white mb-6">Create Container</h2>
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        {error && <div className="bg-red-900/50 text-red-300 px-4 py-2 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Image *</label>
          <input type="text" value={image} onChange={e => setImage(e.target.value)} className={inputClass} placeholder="nginx:latest" required />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Container Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="my-container" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="forcePull" checked={forcePull} onChange={e => setForcePull(e.target.checked)} className="rounded bg-gray-800 border-gray-700" />
          <label htmlFor="forcePull" className="text-sm text-gray-400">Force re-pull image</label>
        </div>
        {/* Ports */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-gray-400">Port Mappings</label>
            <button type="button" onClick={() => addField(setPorts)} className="text-blue-400 hover:text-blue-300"><Plus size={16} /></button>
          </div>
          {ports.map((p, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" value={p} onChange={e => updateField(setPorts, i, e.target.value)} className={inputClass} placeholder="8080:80" />
              {ports.length > 1 && <button type="button" onClick={() => removeField(setPorts, i)} className="text-red-400 hover:text-red-300"><Minus size={16} /></button>}
            </div>
          ))}
        </div>
        {/* Volumes */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-gray-400">Volume Mounts</label>
            <button type="button" onClick={() => addField(setVolumes)} className="text-blue-400 hover:text-blue-300"><Plus size={16} /></button>
          </div>
          {volumes.map((v, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" value={v} onChange={e => updateField(setVolumes, i, e.target.value)} className={inputClass} placeholder="/host/path:/container/path" />
              {volumes.length > 1 && <button type="button" onClick={() => removeField(setVolumes, i)} className="text-red-400 hover:text-red-300"><Minus size={16} /></button>}
            </div>
          ))}
        </div>
        {/* Env vars */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-gray-400">Environment Variables</label>
            <button type="button" onClick={() => addField(setEnvVars)} className="text-blue-400 hover:text-blue-300"><Plus size={16} /></button>
          </div>
          {envVars.map((e, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" value={e} onChange={ev => updateField(setEnvVars, i, ev.target.value)} className={inputClass} placeholder="KEY=VALUE" />
              {envVars.length > 1 && <button type="button" onClick={() => removeField(setEnvVars, i)} className="text-red-400 hover:text-red-300"><Minus size={16} /></button>}
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Container'}
          </button>
          <button type="button" onClick={() => navigate('/')} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm">Cancel</button>
        </div>
      </form>
    </div>
  )
}
