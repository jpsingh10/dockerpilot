import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useSettingsStore } from '../store/settings'
import StatsBar from './StatsBar'
import {
  LayoutDashboard, Box, Layers,
  ImageIcon, HardDrive, Network, Settings, LogOut,
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/containers', label: 'Containers', icon: Box },
  { path: '/stacks', label: 'Stacks', icon: Layers },
  { path: '/images', label: 'Images', icon: ImageIcon },
  { path: '/volumes', label: 'Volumes', icon: HardDrive },
  { path: '/networks', label: 'Networks', icon: Network },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { themeMode } = useSettingsStore()
  const location = useLocation()

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="border-b border-[var(--border)] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--primary)]">
              <LayoutDashboard size={18} />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">DockerPilot</h1>
              <p className="text-xs text-[var(--text-muted)]">Container control plane</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link ${isActive(path) ? 'nav-link-active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[var(--border)] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.username}</p>
              <span className="badge badge-neutral mt-1">
                {user?.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="btn btn-secondary p-2"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <main className="app-main" data-theme={themeMode}>
        <StatsBar />
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
