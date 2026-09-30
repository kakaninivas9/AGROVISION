import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // Increased for AI processing
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrovision_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('agrovision_token')
      localStorage.removeItem('agrovision_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
