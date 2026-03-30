import { create } from 'zustand'
import { api } from '../api/client'

export interface Stack {
  ID: number
  name: string
  repoUrl: string
  branch: string
  composePath: string
  lastStatus: string
  lastCommit: string
  lastDeployedAt: string | null
  webhookId: string
  stackType: string
  localPath: string
}

interface StackState {
  stacks: Stack[]
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  create: (data: { name: string; repoUrl: string; branch: string; composePath: string }) => Promise<void>
  deploy: (id: number) => Promise<void>
  teardown: (id: number) => Promise<void>
  remove: (id: number) => Promise<void>
}

export const useStackStore = create<StackState>((set, get) => ({
  stacks: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null })
    try {
      const stacks = await api.listStacks()
      set({ stacks, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  create: async (data) => { await api.createStack(data); get().fetch() },
  deploy: async (id) => { await api.deployStack(id); get().fetch() },
  teardown: async (id) => { await api.teardownStack(id); get().fetch() },
  remove: async (id) => { await api.deleteStack(id); get().fetch() },
}))
