import axios from 'axios'
import Cookies from 'js-cookie'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle responses and errors
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: () =>
    api.post('/auth/logout'),

  profile: () =>
    api.get('/auth/profile'),

  updateProfile: (userData) =>
    api.put('/auth/profile', userData),

  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),

  refreshToken: () =>
    api.post('/auth/refresh'),
}

// Detection API
export const detectionAPI = {
  analyzeImage: (formData) =>
    api.post('/detection/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  getHistory: (page = 1, limit = 20) =>
    api.get(`/detection/history?page=${page}&limit=${limit}`),

  getDetectionById: (id) =>
    api.get(`/detection/${id}`),

  deleteDetection: (id) =>
    api.delete(`/detection/${id}`),

  bulkDelete: (ids) =>
    api.delete('/detection/bulk', { data: { ids } }),
}

// Analytics API
export const analyticsAPI = {
  getDashboardStats: (period = '7d') =>
    api.get(`/analytics/dashboard?period=${period}`),

  getDetectionStats: (period = '7d') =>
    api.get(`/analytics/detections?period=${period}`),

  getUserActivity: (period = '7d') =>
    api.get(`/analytics/activity?period=${period}`),

  getSystemHealth: () =>
    api.get('/analytics/system'),
}

// System API
export const systemAPI = {
  getHealth: () =>
    api.get('/system/health'),

  getStats: () =>
    api.get('/system/stats'),

  getLogs: (level = 'all', limit = 100) =>
    api.get(`/system/logs?level=${level}&limit=${limit}`),
}

export default api