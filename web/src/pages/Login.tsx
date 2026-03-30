import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { Container } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Container size={48} className="mx-auto text-blue-500 mb-4" />
          <h1 className="text-2xl font-bold text-white">DockerPilot</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to manage your containers</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
          {error && <div className="bg-red-900/50 text-red-300 px-4 py-2 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-2 bg-gray-900 text-gray-500">or</span></div>
          </div>
          <a href="/api/v1/auth/oidc/redirect"
            className="block w-full text-center bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg font-medium transition-colors">
            Sign in with SSO
          </a>
        </form>
        <p className="text-center text-gray-600 text-xs mt-4">Default credentials: admin / admin</p>
      </div>
    </div>
  )
}
