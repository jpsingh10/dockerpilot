const BASE_URL = '/api/v1'

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || res.statusText)
  }
  return res.json()
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: { id: number; username: string; role: string } }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ id: number; username: string; role: string }>('/auth/me'),
  listContainers: () =>
    request<Array<{
      ID: string; Names: string; Image: string; Status: string;
      State: string; Ports: string; CreatedAt: string;
    }>>('/containers'),
  createContainer: (data: {
    image: string; name: string; ports: string[];
    volumes: string[]; env: string[]; forcePull: boolean;
  }) => request<{ id: string }>('/containers', { method: 'POST', body: JSON.stringify(data) }),
  startContainer: (id: string) => request('/containers/' + id + '/start', { method: 'POST' }),
  stopContainer: (id: string) => request('/containers/' + id + '/stop', { method: 'POST' }),
  restartContainer: (id: string) => request('/containers/' + id + '/restart', { method: 'POST' }),
  removeContainer: (id: string, force = false) =>
    request('/containers/' + id + '?force=' + force, { method: 'DELETE' }),
  listStacks: () =>
    request<Array<{
      ID: number; name: string; repoUrl: string; branch: string;
      composePath: string; lastStatus: string; lastCommit: string;
      lastDeployedAt: string | null; webhookId: string;
      stackType: string; localPath: string;
    }>>('/stacks'),
  createStack: (data: { name: string; repoUrl: string; branch: string; composePath: string }) =>
    request('/stacks', { method: 'POST', body: JSON.stringify(data) }),
  deployStack: (id: number) => request('/stacks/' + id + '/deploy', { method: 'POST' }),
  teardownStack: (id: number) => request('/stacks/' + id + '/teardown', { method: 'POST' }),
  deleteStack: (id: number) => request('/stacks/' + id, { method: 'DELETE' }),

  // Images
  listImages: () => request<Array<{
    ID: string; Repository: string; Tag: string; Size: string;
    CreatedAt: string; CreatedSince: string;
  }>>('/images'),
  removeImage: (id: string, force = false) =>
    request('/images/' + encodeURIComponent(id) + '?force=' + force, { method: 'DELETE' }),
  pruneImages: () => request<{ status: string; output: string }>('/images/prune', { method: 'POST' }),

  // Volumes
  listVolumes: () => request<Array<{
    Name: string; Driver: string; Scope: string;
    Mountpoint: string; CreatedAt: string; Labels: string;
  }>>('/volumes'),
  createVolume: (data: { name: string; driver: string }) =>
    request('/volumes', { method: 'POST', body: JSON.stringify(data) }),
  removeVolume: (name: string) =>
    request('/volumes/' + encodeURIComponent(name), { method: 'DELETE' }),
  pruneVolumes: () => request('/volumes/prune', { method: 'POST' }),

  // Networks
  listNetworks: () => request<Array<{
    id: string; name: string; driver: string; scope: string;
    subnet: string; gateway: string; containers: number;
  }>>('/networks'),
  createNetwork: (data: { name: string; driver: string; subnet: string; gateway: string }) =>
    request('/networks', { method: 'POST', body: JSON.stringify(data) }),
  removeNetwork: (id: string) =>
    request('/networks/' + id, { method: 'DELETE' }),
  pruneNetworks: () => request('/networks/prune', { method: 'POST' }),

  // System
  systemInfo: () => request<{
    ServerVersion: string; NCPU: number; MemTotal: number;
    Images: number; Containers: number;
    ContainersRunning: number; ContainersStopped: number;
  }>('/system/info'),

  // Users
  listUsers: () => request<Array<{
    ID: number; username: string; email: string; role: string;
  }>>('/users'),
  createUser: (data: { username: string; email: string; password: string; role: string }) =>
    request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: { email?: string; role?: string; password?: string }) =>
    request('/users/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: number) =>
    request('/users/' + id, { method: 'DELETE' }),

  // Stack compose file
  getComposeFile: (id: number) =>
    request<{ content: string; path: string }>('/stacks/' + id + '/compose'),
  updateComposeFile: (id: number, content: string) =>
    request('/stacks/' + id + '/compose', { method: 'PUT', body: JSON.stringify({ content }) }),
}
