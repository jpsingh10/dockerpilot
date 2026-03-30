import { useEffect, useState } from 'react'
import { useStackStore } from '../store/stacks'
import StackCard from '../components/StackCard'
import { Plus, X } from 'lucide-react'

export default function Stacks() {
  const { stacks, loading, fetch, create } = useStackStore()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [composePath, setComposePath] = useState('docker-compose.yml')
  const [error, setError] = useState('')

  useEffect(() => { fetch() }, [fetch])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !repoUrl) { setError('Name and repo URL are required'); return }
    setError('')
    try {
      await create({ name, repoUrl, branch, composePath })
      setShowForm(false)
      setName(''); setRepoUrl(''); setBranch('main'); setComposePath('docker-compose.yml')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Stacks</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancel' : 'Add Stack'}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          {error && <div className="bg-red-900/50 text-red-300 px-4 py-2 rounded-lg text-sm">{error}</div>}
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
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Create Stack</button>
        </form>
      )}
      {stacks.length === 0 && !loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400">No stacks configured</p>
          <p className="text-gray-500 text-sm mt-1">Click "Add Stack" to connect a Git repository</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stacks.map(s => <StackCard key={s.ID} stack={s} />)}
        </div>
      )}
    </div>
  )
}
