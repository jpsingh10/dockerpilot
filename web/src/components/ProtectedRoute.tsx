import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuthStore()
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}
