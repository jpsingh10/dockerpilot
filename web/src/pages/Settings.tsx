import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { useUserStore } from '../store/users'
import { useSystemStore } from '../store/system'
import { useSettingsStore } from '../store/settings'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { Trash2 } from 'lucide-react'
import type { Column } from '../components/DataTable'
import type { UserInfo } from '../store/users'

type Tab = 'general' | 'auth' | 'about'

export default function Settings() {
  const [tab, setTab] = useState<Tab>('general')
  const { isAdmin } = useAuthStore()

  const tabs: { key: Tab; label: string; adminOnly?: boolean }[] = [
    { key: 'general', label: 'General' },
    { key: 'auth', label: 'Authentication', adminOnly: true },
    { key: 'about', label: 'About' },
  ]

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-4">Settings</h1>
      <div className="flex gap-1 border-b border-gray-800 mb-6">
        {tabs
          .filter((t) => !t.adminOnly || isAdmin())
          .map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                tab === t.key
                  ? 'border-b-2 border-blue-500 text-blue-400 px-4 py-2 text-sm'
                  : 'text-gray-400 px-4 py-2 text-sm hover:text-gray-200'
              }
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === 'general' && <GeneralTab />}
      {tab === 'auth' && isAdmin() && <AuthTab />}
      {tab === 'about' && <AboutTab />}
    </div>
  )
}

function GeneralTab() {
  const settings = useSettingsStore()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Display</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between bg-[#111827] border border-gray-800 rounded-xl p-4">
              <span className="text-sm text-gray-300">Show stopped containers</span>
              <button
                onClick={() => settings.update({ showStoppedContainers: !settings.showStoppedContainers })}
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  settings.showStoppedContainers ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`block w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                    settings.showStoppedContainers ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>

            <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
              <span className="text-sm text-gray-300 block mb-2">Time format</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input
                    type="radio"
                    name="timeFormat"
                    checked={settings.timeFormat === '24h'}
                    onChange={() => settings.update({ timeFormat: '24h' })}
                    className="accent-blue-500"
                  />
                  24h
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input
                    type="radio"
                    name="timeFormat"
                    checked={settings.timeFormat === '12h'}
                    onChange={() => settings.update({ timeFormat: '12h' })}
                    className="accent-blue-500"
                  />
                  12h
                </label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Confirmations</h3>
          <label className="flex items-center justify-between bg-[#111827] border border-gray-800 rounded-xl p-4">
            <span className="text-sm text-gray-300">Confirm destructive actions</span>
            <button
              onClick={() => settings.update({ confirmDestructive: !settings.confirmDestructive })}
              className={`w-10 h-5 rounded-full relative transition-colors ${
                settings.confirmDestructive ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`block w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                  settings.confirmDestructive ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Log Viewer</h3>
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
            <label className="text-sm text-gray-300 block mb-2">Log buffer size</label>
            <input
              type="number"
              value={settings.logBufferSize}
              onChange={(e) => settings.update({ logBufferSize: parseInt(e.target.value) || 1000 })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-32"
              min={100}
              max={10000}
            />
          </div>
        </div>
      </div>

      <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
        <p className="text-gray-500 text-sm">More settings coming soon...</p>
      </div>
    </div>
  )
}

function AuthTab() {
  const { users, loading, fetch, create, remove } = useUserStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('user')

  useEffect(() => {
    fetch()
  }, [fetch])

  const handleCreate = async () => {
    if (!newUsername.trim() || !newPassword.trim()) return
    await create({ username: newUsername, email: newEmail, password: newPassword, role: newRole })
    setNewUsername('')
    setNewEmail('')
    setNewPassword('')
    setNewRole('user')
    setShowAddForm(false)
  }

  const columns: Column<UserInfo>[] = [
    { key: 'username', label: 'Username', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (u) => <StatusBadge status={u.role} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '80px',
      render: (u) => (
        <button
          onClick={() => remove(u.ID)}
          className="p-1.5 rounded hover:bg-gray-700 text-red-400"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300">Users</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm"
        >
          Add User
        </button>
      </div>

      {showAddForm && (
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 mb-4 flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="admin">admin</option>
              <option value="user">user</option>
              <option value="viewer">viewer</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Create
          </button>
        </div>
      )}

      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden">
        <DataTable columns={columns} data={users} keyField="ID" loading={loading} emptyMessage="No users found" />
      </div>
    </div>
  )
}

function AboutTab() {
  const { info, fetch } = useSystemStore()

  useEffect(() => {
    fetch()
  }, [fetch])

  const formatBytes = (bytes: number) => {
    if (!bytes) return '-'
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)} GB`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">DockerPilot</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-400">Version</dt>
            <dd className="text-white">1.0.0</dd>
          </div>
        </dl>
      </div>
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Docker</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-400">Server Version</dt>
            <dd className="text-white">{info?.ServerVersion || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">CPUs</dt>
            <dd className="text-white">{info?.NCPU || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">Memory</dt>
            <dd className="text-white">{info?.MemTotal ? formatBytes(info.MemTotal) : '-'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
