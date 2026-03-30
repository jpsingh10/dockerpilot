import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { LayoutDashboard, Container, Layers, LogOut } from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/containers/new', label: 'Create Container', icon: Container },
  { path: '/stacks', label: 'Stacks', icon: Layers },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">DockerPilot</h1>
          <p className="text-xs text-gray-400 mt-1">Docker Management</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">{user?.username}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <button onClick={logout} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-950 p-6">
        <Outlet />
      </main>
    </div>
  )
}
