import { create } from 'zustand'
import { api } from '../api/client'

export interface Container {
  ID: string
  Names: string
  Image: string
  Status: string
  State: string
  Ports: string
  CreatedAt: string
  Restarts: number
  CPUPerc: string
  MemUsage: string
  NetIO: string
  BlockIO: string
  IPAddress: string
  Stack: string
}

interface ContainerState {
  containers: Container[]
  loading: boolean
  error: string | null
  selected: Set<string>
  fetch: () => Promise<void>
  start: (id: string) => Promise<void>
  stop: (id: string) => Promise<void>
  restart: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  toggleSelect: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  bulkStop: () => Promise<void>
  bulkRemove: () => Promise<void>
}

export const useContainerStore = create<ContainerState>((set, get) => ({
  containers: [],
  loading: false,
  error: null,
  selected: new Set<string>(),
  fetch: async () => {
    const isInitial = get().containers.length === 0
    if (isInitial) set({ loading: true })
    set({ error: null })
    try {
      const containers = await api.listContainers()
      set({ containers, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  start: async (id) => { await api.startContainer(id); get().fetch() },
  stop: async (id) => { await api.stopContainer(id); get().fetch() },
  restart: async (id) => { await api.restartContainer(id); get().fetch() },
  remove: async (id) => { await api.removeContainer(id, true); get().fetch() },
  toggleSelect: (id) => {
    const s = new Set(get().selected)
    if (s.has(id)) s.delete(id); else s.add(id)
    set({ selected: s })
  },
  selectAll: () => set({ selected: new Set(get().containers.map(c => c.ID)) }),
  clearSelection: () => set({ selected: new Set() }),
  bulkStop: async () => {
    const ids = Array.from(get().selected)
    await Promise.allSettled(ids.map(id => api.stopContainer(id)))
    set({ selected: new Set() })
    get().fetch()
  },
  bulkRemove: async () => {
    const ids = Array.from(get().selected)
    await Promise.allSettled(ids.map(id => api.removeContainer(id, true)))
    set({ selected: new Set() })
    get().fetch()
  },
}))
