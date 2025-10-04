import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

// User Pages
import Home from '../pages/Home'
import History from '../pages/user/History'
import Reports from '../pages/user/Reports'
import Settings from '../pages/user/Settings'

const UserRoutes = () => {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/history" element={<History />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default UserRoutes