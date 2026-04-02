import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('useSettingsStore theme mode', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('defaults to dark when no saved settings exist', async () => {
    const { useSettingsStore } = await import('./settings')

    expect(useSettingsStore.getState().themeMode).toBe('dark')
  })

  it('persists themeMode updates to localStorage', async () => {
    const { useSettingsStore } = await import('./settings')

    useSettingsStore.getState().update({ themeMode: 'light' })

    expect(useSettingsStore.getState().themeMode).toBe('light')
    expect(JSON.parse(localStorage.getItem('dockerpilot-settings') || '{}')).toMatchObject({
      themeMode: 'light',
    })
  })

  it('rehydrates themeMode from localStorage', async () => {
    localStorage.setItem('dockerpilot-settings', JSON.stringify({
      showStoppedContainers: true,
      timeFormat: '24h',
      confirmDestructive: true,
      logBufferSize: 1000,
      themeMode: 'light',
    }))

    const { useSettingsStore } = await import('./settings')

    expect(useSettingsStore.getState().themeMode).toBe('light')
  })
})
