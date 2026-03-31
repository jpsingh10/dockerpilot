import { create } from 'zustand'
import { api } from '../api/client'

export interface UserInfo {
  ID: number
  username: string
  email: string
  role: string
}

interface UserState {
  users: UserInfo[]
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  create: (data: { username: string; email: string; password: string; role: string }) => Promise<void>
  update: (id: number, data: { email?: string; role?: string; password?: string }) => Promise<void>
  remove: (id: number) => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null })
    try {
      const users = await api.listUsers()
      set({ users, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  create: async (data) => { await api.createUser(data); get().fetch() },
  update: async (id, data) => { await api.updateUser(id, data); get().fetch() },
  remove: async (id) => { await api.deleteUser(id); get().fetch() },
}))
