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
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Container size={44} className="mx-auto mb-4 text-[var(--primary)]" />
          <h1 className="text-2xl font-semibold tracking-tight">DockerPilot</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Sign in to manage your containers</p>
        </div>
        <form onSubmit={handleSubmit} className="surface space-y-4 p-6">
          {error && <div className="badge badge-danger w-full justify-start px-3 py-2 text-sm">{error}</div>}
          <div>
            <label htmlFor="username" className="mb-1 block text-sm text-[var(--text-muted)]">Username</label>
            <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="input" required />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-[var(--text-muted)]">Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input" required />
          </div>
          <button type="submit" disabled={loading}
            className="btn btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-[var(--surface)] px-2 text-[var(--text-soft)]">or</span></div>
          </div>
          <a href="/api/v1/auth/oidc/redirect"
            className="btn btn-secondary block w-full text-center">
            Sign in with SSO
          </a>
        </form>
        <p className="mt-4 text-center text-xs text-[var(--text-soft)]">Default credentials: admin / admin</p>
      </div>
    </div>
  )
}
