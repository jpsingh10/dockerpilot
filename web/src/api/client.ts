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
}
