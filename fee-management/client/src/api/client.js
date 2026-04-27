import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api'

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add token to headers
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('fee_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => Promise.reject(error))

// Response interceptor - handle 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fee_token')
      localStorage.removeItem('fee_admin_email')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
