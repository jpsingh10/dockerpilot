import { create } from 'zustand'
import { api } from '../api/client'

export interface SystemInfo {
  ServerVersion: string
  NCPU: number
  MemTotal: number
  Images: number
  Containers: number
  ContainersRunning: number
  ContainersStopped: number
}

interface SystemState {
  info: SystemInfo | null
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
}

export const useSystemStore = create<SystemState>((set) => ({
  info: null,
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null })
    try {
      const info = await api.systemInfo()
      set({ info, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
}))
