import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import { useAuthStore } from '../store/auth'
import { useSettingsStore } from '../store/settings'

vi.mock('./StatsBar', () => ({
  default: () => <div data-testid="stats-bar" />,
}))

describe('Layout', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      token: 'token',
      user: { id: 1, username: 'jdoe', role: 'admin' },
      loading: false,
    })
    useSettingsStore.setState({
      showStoppedContainers: true,
      timeFormat: '24h',
      confirmDestructive: true,
      logBufferSize: 1000,
      themeMode: 'light',
      update: useSettingsStore.getState().update,
      reset: useSettingsStore.getState().reset,
    })
  })

  it('renders the shell with active navigation and theme data', () => {
    render(
      <MemoryRouter initialEntries={['/containers']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/containers" element={<div>containers</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('DockerPilot')).toBeInTheDocument()
    expect(screen.getByText('Containers').closest('a')).toHaveClass('nav-link-active')
    expect(screen.getByText('jdoe')).toBeInTheDocument()
    expect(screen.getByTestId('stats-bar')).toBeInTheDocument()
    expect(document.querySelector('main')).toHaveAttribute('data-theme', 'light')
  })
})
