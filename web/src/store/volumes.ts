import { create } from 'zustand'
import { api } from '../api/client'

export interface VolumeInfo {
  Name: string
  Driver: string
  Scope: string
  Mountpoint: string
  CreatedAt: string
  Labels: string
}

interface VolumeState {
  volumes: VolumeInfo[]
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  create: (data: { name: string; driver: string }) => Promise<void>
  remove: (name: string) => Promise<void>
  prune: () => Promise<void>
}

export const useVolumeStore = create<VolumeState>((set, get) => ({
  volumes: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null })
    try {
      const volumes = await api.listVolumes()
      set({ volumes, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  create: async (data) => { await api.createVolume(data); get().fetch() },
  remove: async (name) => { await api.removeVolume(name); get().fetch() },
  prune: async () => { await api.pruneVolumes(); get().fetch() },
}))
