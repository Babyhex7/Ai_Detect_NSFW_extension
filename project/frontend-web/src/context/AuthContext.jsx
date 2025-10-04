import React, { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { authAPI } from '../services/api'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = Cookies.get('authToken')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await authAPI.profile()
      if (response.success) {
        setUser(response.data.user)
        setIsAuthenticated(true)
      } else {
        // Token invalid, remove it
        Cookies.remove('authToken')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      Cookies.remove('authToken')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password)
      
      if (response.success) {
        const { user, token } = response.data
        
        // Store token in cookie (7 days)
        Cookies.set('authToken', token, { 
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        })
        
        setUser(user)
        setIsAuthenticated(true)
        
        return { success: true, user }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please try again.' 
      }
    }
  }

  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register(name, email, password)
      
      if (response.success) {
        const { user, token } = response.data
        
        // Store token in cookie (7 days)
        Cookies.set('authToken', token, { 
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        })
        
        setUser(user)
        setIsAuthenticated(true)
        
        return { success: true, user }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Register error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed. Please try again.' 
      }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      Cookies.remove('authToken')
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const updateProfile = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData)
      
      if (response.success) {
        setUser(response.data.user)
        return { success: true, user: response.data.user }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Update profile error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Update failed. Please try again.' 
      }
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}