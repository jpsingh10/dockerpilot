import { create } from 'zustand'
import { api } from '../api/client'

export interface ImageInfo {
  ID: string
  Repository: string
  Tag: string
  Size: string
  CreatedAt: string
  CreatedSince: string
}

interface ImageState {
  images: ImageInfo[]
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  remove: (id: string) => Promise<void>
  prune: () => Promise<void>
}

export const useImageStore = create<ImageState>((set, get) => ({
  images: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null })
    try {
      const images = await api.listImages()
      set({ images, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  remove: async (id) => { await api.removeImage(id); get().fetch() },
  prune: async () => { await api.pruneImages(); get().fetch() },
}))
