import { useState, useEffect, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { useUserStore } from '../store/users'
import { useSystemStore } from '../store/system'
import { useSettingsStore } from '../store/settings'
import { api } from '../api/client'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToastStore } from '../components/Toast'
import type { Column } from '../components/DataTable'
import type { UserInfo } from '../store/users'

type Tab = 'general' | 'repo' | 'auth' | 'oidc' | 'about'

export default function Settings() {
  const [tab, setTab] = useState<Tab>('general')
  const { isAdmin } = useAuthStore()

  const tabs: { key: Tab; label: string; adminOnly?: boolean }[] = [
    { key: 'general', label: 'General' },
    { key: 'repo', label: 'Repository', adminOnly: true },
    { key: 'auth', label: 'Users', adminOnly: true },
    { key: 'oidc', label: 'OIDC / SSO', adminOnly: true },
    { key: 'about', label: 'About' },
  ]

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold tracking-tight">Settings</h1>
      <div className="mb-6 flex gap-1 border-b border-[var(--border)]">
        {tabs
          .filter((t) => !t.adminOnly || isAdmin())
          .map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                tab === t.key
                  ? 'border-b-2 border-[var(--primary)] px-4 py-2 text-sm text-[var(--text)]'
                  : 'px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]'
              }
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === 'general' && <GeneralTab />}
      {tab === 'repo' && isAdmin() && <RepoTab />}
      {tab === 'auth' && isAdmin() && <AuthTab />}
      {tab === 'oidc' && isAdmin() && <OIDCTab />}
      {tab === 'about' && <AboutTab />}
    </div>
  )
}

function GeneralTab() {
  const settings = useSettingsStore()

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="space-y-6">
        <section>
          <h3 className="section-title mb-3">Display</h3>
          <div className="space-y-4">
            <div className="surface flex items-center justify-between p-4">
              <span className="text-sm text-[var(--text)]">Show stopped containers</span>
              <button
                onClick={() => settings.update({ showStoppedContainers: !settings.showStoppedContainers })}
                className={`relative h-5 w-10 rounded-full transition-colors ${
                  settings.showStoppedContainers ? 'bg-[var(--success)]' : 'bg-[var(--text-soft)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 block h-4 w-4 rounded-full bg-white transition-transform ${
                    settings.showStoppedContainers ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="surface p-4">
              <span className="mb-2 block text-sm text-[var(--text)]">Theme</span>
              <div className="flex gap-2">
                <button
                  onClick={() => settings.update({ themeMode: 'dark' })}
                  className={settings.themeMode === 'dark' ? 'btn btn-primary' : 'btn btn-secondary'}
                >
                  Dark
                </button>
                <button
                  onClick={() => settings.update({ themeMode: 'light' })}
                  className={settings.themeMode === 'light' ? 'btn btn-primary' : 'btn btn-secondary'}
                >
                  Light
                </button>
              </div>
            </div>

            <div className="surface p-4">
              <span className="mb-2 block text-sm text-[var(--text)]">Time format</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <input
                    type="radio"
                    name="timeFormat"
                    checked={settings.timeFormat === '24h'}
                    onChange={() => settings.update({ timeFormat: '24h' })}
                    className="accent-[var(--primary)]"
                  />
                  24h
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <input
                    type="radio"
                    name="timeFormat"
                    checked={settings.timeFormat === '12h'}
                    onChange={() => settings.update({ timeFormat: '12h' })}
                    className="accent-[var(--primary)]"
                  />
                  12h
                </label>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="section-title mb-3">Confirmations</h3>
          <div className="surface flex items-center justify-between p-4">
            <span className="text-sm text-[var(--text)]">Confirm destructive actions</span>
            <button
              onClick={() => settings.update({ confirmDestructive: !settings.confirmDestructive })}
              className={`relative h-5 w-10 rounded-full transition-colors ${
                settings.confirmDestructive ? 'bg-[var(--success)]' : 'bg-[var(--text-soft)]'
              }`}
            >
              <span
                className={`absolute top-0.5 block h-4 w-4 rounded-full bg-white transition-transform ${
                  settings.confirmDestructive ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </section>

        <section>
          <h3 className="section-title mb-3">Log Viewer</h3>
          <div className="surface p-4">
            <label className="mb-2 block text-sm text-[var(--text)]">Log buffer size</label>
            <input
              type="number"
              value={settings.logBufferSize}
              onChange={(e) => settings.update({ logBufferSize: parseInt(e.target.value) || 1000 })}
              className="input w-32"
              min={100}
              max={10000}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function RepoTab() {
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToastStore()

  useEffect(() => {
    api.getGitSettings()
      .then((data) => {
        setRepoUrl(data.repoUrl || '')
        setBranch(data.branch || 'main')
        setToken(data.token || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateGitSettings({ repoUrl, branch, token })
      addToast('Git settings saved', 'success')
    } catch (err: any) {
      addToast('Error: ' + err.message, 'error')
    }
    setSaving(false)
  }

  if (loading) return <div className="text-sm text-[var(--text-muted)]">Loading...</div>

  return (
    <div className="max-w-2xl">
      <h3 className="section-title mb-4">Git Repository</h3>
      <div className="surface space-y-4 p-6">
        <Field label="Repository URL" description="HTTPS URL of the Git repository containing your stack definitions">
          <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} className="input" placeholder="https://github.com/org/repo.git" />
        </Field>
        <Field label="Branch" description="Branch to pull stack definitions from">
          <input value={branch} onChange={(e) => setBranch(e.target.value)} className="input" placeholder="main" />
        </Field>
        <Field label="Personal Access Token" description="Required for private repositories. Token needs read access to repository contents.">
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} className="input" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" />
        </Field>
        <div className="flex justify-end pt-2">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
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
  const [confirmDelete, setConfirmDelete] = useState<UserInfo | null>(null)
  const { addToast } = useToastStore()

  useEffect(() => {
    fetch()
  }, [fetch])

  const handleCreate = async () => {
    if (!newUsername.trim() || !newPassword.trim()) return
    try {
      await create({ username: newUsername, email: newEmail, password: newPassword, role: newRole })
      addToast('User created successfully', 'success')
    } catch (err: any) {
      addToast('Error creating user: ' + err.message, 'error')
    }
    setNewUsername('')
    setNewEmail('')
    setNewPassword('')
    setNewRole('user')
    setShowAddForm(false)
  }

  const handleDelete = async (user: UserInfo) => {
    try {
      await remove(user.ID)
      addToast('User deleted successfully', 'success')
    } catch (err: any) {
      addToast('Error deleting user: ' + err.message, 'error')
    }
    setConfirmDelete(null)
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
          onClick={() => setConfirmDelete(u)}
          className="rounded p-1.5 text-[var(--danger)] hover:bg-[var(--bg-elevated)]"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">Users</h3>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
          Add User
        </button>
      </div>

      {showAddForm && (
        <div className="surface mb-4 flex flex-wrap items-end gap-4 p-4">
          <Field label="Username">
            <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="input" />
          </Field>
          <Field label="Email">
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="input" />
          </Field>
          <Field label="Password">
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" />
          </Field>
          <Field label="Role">
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="select">
              <option value="admin">admin</option>
              <option value="user">user</option>
              <option value="viewer">viewer</option>
            </select>
          </Field>
          <button onClick={handleCreate} className="btn btn-primary">
            Create
          </button>
        </div>
      )}

      <div className="table-shell">
        <DataTable columns={columns} data={users} keyField="ID" loading={loading} emptyMessage="No users found" />
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete User"
        message={`Are you sure you want to delete user "${confirmDelete?.username}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function OIDCTab() {
  const [issuer, setIssuer] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [redirectUrl, setRedirectUrl] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToastStore()

  useEffect(() => {
    api.getOIDCSettings()
      .then((data) => {
        setIssuer(data.issuer)
        setClientId(data.clientId)
        setRedirectUrl(data.redirectUrl)
        setEnabled(data.enabled)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await api.updateOIDCSettings({ issuer, clientId, clientSecret, redirectUrl })
      addToast(result.note || 'OIDC settings saved', 'success')
      setClientSecret('')
    } catch (err: any) {
      addToast('Error: ' + err.message, 'error')
    }
    setSaving(false)
  }

  if (loading) return <div className="text-sm text-[var(--text-muted)]">Loading...</div>

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <h3 className="section-title">OpenID Connect (SSO)</h3>
        <span className={`badge ${enabled ? 'badge-success' : 'badge-neutral'}`}>
          {enabled ? 'Configured' : 'Not configured'}
        </span>
      </div>

      <div className="surface space-y-4 p-6">
        <Field label="Issuer URL" description="The OpenID Connect discovery URL of your identity provider">
          <input value={issuer} onChange={(e) => setIssuer(e.target.value)} className="input" placeholder="https://accounts.google.com" />
        </Field>
        <Field label="Client ID">
          <input value={clientId} onChange={(e) => setClientId(e.target.value)} className="input" placeholder="your-client-id" />
        </Field>
        <Field label="Client Secret" description="Leave blank to keep the existing secret">
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            className="input"
            placeholder={enabled ? '(unchanged - leave blank to keep current)' : 'your-client-secret'}
          />
        </Field>
        <Field label="Redirect URL" description="Must match the redirect URI configured in your identity provider">
          <input
            value={redirectUrl}
            onChange={(e) => setRedirectUrl(e.target.value)}
            className="input"
            placeholder="http://localhost:8080/api/v1/auth/oidc/callback"
          />
        </Field>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[var(--warning)]">A restart is required for OIDC changes to take effect</p>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="surface p-5">
        <h3 className="section-title mb-3">DockerPilot</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--text-muted)]">Version</dt>
            <dd>1.0.0</dd>
          </div>
        </dl>
      </div>
      <div className="surface p-5">
        <h3 className="section-title mb-3">Docker</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--text-muted)]">Server Version</dt>
            <dd>{info?.ServerVersion || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--text-muted)]">CPUs</dt>
            <dd>{info?.NCPU || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--text-muted)]">Memory</dt>
            <dd>{info?.MemTotal ? formatBytes(info.MemTotal) : '-'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

function Field({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-[var(--text-muted)]">{label}</label>
      {children}
      {description && <p className="mt-1 text-xs text-[var(--text-soft)]">{description}</p>}
    </div>
  )
}
