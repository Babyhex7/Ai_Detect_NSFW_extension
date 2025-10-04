import { Routes, Route, Navigate } from 'react-router-dom'

// Public Pages
import LandingPage from '../pages/LandingPage'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'

const AuthRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AuthRoutes