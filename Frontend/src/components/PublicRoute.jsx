import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

export default PublicRoute