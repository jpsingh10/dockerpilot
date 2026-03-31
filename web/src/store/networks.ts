import { create } from 'zustand'
import { api } from '../api/client'

export interface NetworkInfo {
  id: string
  name: string
  driver: string
  scope: string
  subnet: string
  gateway: string
  containers: number
}

interface NetworkState {
  networks: NetworkInfo[]
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  create: (data: { name: string; driver: string; subnet: string; gateway: string }) => Promise<void>
  remove: (id: string) => Promise<void>
  prune: () => Promise<void>
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  networks: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null })
    try {
      const networks = await api.listNetworks()
      set({ networks, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  create: async (data) => { await api.createNetwork(data); get().fetch() },
  remove: async (id) => { await api.removeNetwork(id); get().fetch() },
  prune: async () => { await api.pruneNetworks(); get().fetch() },
}))
