import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastContainer } from './components/Toast'
import { useAuthStore } from './store/auth'
import { useSettingsStore } from './store/settings'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Containers from './pages/Containers'
import ContainerDetail from './pages/ContainerDetail'
import CreateContainer from './pages/CreateContainer'
import Stacks from './pages/Stacks'
import Images from './pages/Images'
import Volumes from './pages/Volumes'
import Networks from './pages/Networks'
import Settings from './pages/Settings'

export default function App() {
  const { checkAuth } = useAuthStore()
  const themeMode = useSettingsStore((state) => state.themeMode)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('token', token)
      window.history.replaceState({}, '', '/')
    }
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode
  }, [themeMode])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/containers" element={<Containers />} />
          <Route path="/containers/new" element={<CreateContainer />} />
          <Route path="/containers/:id" element={<ContainerDetail />} />
          <Route path="/stacks" element={<Stacks />} />
          <Route path="/images" element={<Images />} />
          <Route path="/volumes" element={<Volumes />} />
          <Route path="/networks" element={<Networks />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}
