import { create } from 'zustand'

export interface AppSettings {
  showStoppedContainers: boolean
  timeFormat: '24h' | '12h'
  confirmDestructive: boolean
  logBufferSize: number
}

const STORAGE_KEY = 'dockerpilot-settings'

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return defaultSettings
}

const defaultSettings: AppSettings = {
  showStoppedContainers: true,
  timeFormat: '24h',
  confirmDestructive: true,
  logBufferSize: 1000,
}

interface SettingsState extends AppSettings {
  update: (patch: Partial<AppSettings>) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  ...loadSettings(),
  update: (patch) =>
    set((state) => {
      const next = { ...state, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        showStoppedContainers: next.showStoppedContainers,
        timeFormat: next.timeFormat,
        confirmDestructive: next.confirmDestructive,
        logBufferSize: next.logBufferSize,
      }))
      return patch
    }),
  reset: () => {
    localStorage.removeItem(STORAGE_KEY)
    set(defaultSettings)
  },
}))
