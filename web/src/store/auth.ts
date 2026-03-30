import { create } from 'zustand'
import { api } from '../api/client'

interface User {
  id: number
  username: string
  role: string
}

interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  loading: true,
  login: async (username, password) => {
    const res = await api.login(username, password)
    localStorage.setItem('token', res.token)
    set({ token: res.token, user: res.user })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null })
  },
  checkAuth: async () => {
    const token = localStorage.getItem('token')
    if (!token) { set({ loading: false }); return }
    try {
      const user = await api.me()
      set({ token, user, loading: false })
    } catch {
      localStorage.removeItem('token')
      set({ token: null, user: null, loading: false })
    }
  },
}))
