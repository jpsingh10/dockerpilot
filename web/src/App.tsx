import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ContainerDetail from './pages/ContainerDetail'
import CreateContainer from './pages/CreateContainer'
import Stacks from './pages/Stacks'

export default function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('token', token)
      window.history.replaceState({}, '', '/')
    }
    checkAuth()
  }, [checkAuth])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/containers/new" element={<CreateContainer />} />
          <Route path="/containers/:id" element={<ContainerDetail />} />
          <Route path="/stacks" element={<Stacks />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
