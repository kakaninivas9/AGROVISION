import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('agrovision_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (identifier, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { identifier, password })
      localStorage.setItem('agrovision_token', data.token)
      localStorage.setItem('agrovision_user', JSON.stringify(data.user))
      setUser(data.user)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' }
    } finally {
      setLoading(false)
    }
  }

  const register = async (name, email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', { name, email, password })
      localStorage.setItem('agrovision_token', data.token)
      localStorage.setItem('agrovision_user', JSON.stringify(data.user))
      setUser(data.user)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Registration failed' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('agrovision_token')
    localStorage.removeItem('agrovision_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
