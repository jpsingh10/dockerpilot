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
}

interface ContainerState {
  containers: Container[]
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  start: (id: string) => Promise<void>
  stop: (id: string) => Promise<void>
  restart: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useContainerStore = create<ContainerState>((set, get) => ({
  containers: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null })
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
}))
