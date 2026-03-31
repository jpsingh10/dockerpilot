import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import StatsBar from './StatsBar'
import {
  LayoutDashboard, Box, FileText, Terminal, Layers,
  ImageIcon, HardDrive, Network, Archive, Activity,
  Calendar, Settings, LogOut,
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/containers', label: 'Containers', icon: Box },
  { path: '/logs', label: 'Logs', icon: FileText },
  { path: '/shell', label: 'Shell', icon: Terminal },
  { path: '/stacks', label: 'Stacks', icon: Layers },
  { path: '/images', label: 'Images', icon: ImageIcon },
  { path: '/volumes', label: 'Volumes', icon: HardDrive },
  { path: '/networks', label: 'Networks', icon: Network },
  { path: '/registry', label: 'Registry', icon: Archive },
  { path: '/activity', label: 'Activity', icon: Activity },
  { path: '/schedules', label: 'Schedules', icon: Calendar },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-[#0f1724] flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">DockerPilot</h1>
          <p className="text-xs text-gray-400 mt-1">Docker Management</p>
        </div>
        <nav className="flex-1 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                isActive(path)
                  ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border-l-2 border-transparent'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">{user?.username}</p>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300">
                {user?.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0b1120]">
        <StatsBar />
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
