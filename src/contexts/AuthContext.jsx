import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext()

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
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
      // Try to fetch user data, but don't block if it fails
      fetchUser().catch(() => {
        // If fetch fails, clear token and let user login again
        console.log('Failed to fetch user, clearing token')
        logout()
      })
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/user-detail')
      if (response.data.success) {
        setUser(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      console.log('Attempting login with:', credentials.email)
      const response = await api.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
        loginType: 'email'
      })
      
      console.log('Login response:', response.data)
      
      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data
        
        localStorage.setItem('token', token)
        setToken(token)
        setUser(user)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setLoading(false) // Set loading to false after successful login
        
        console.log('Login successful, user:', user)
        return { success: true }
      } else {
        return {
          success: false,
          message: response.data.message || 'Login failed'
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      console.error('Error response:', error.response?.data)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed. Please check your credentials.'
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data
        
        localStorage.setItem('token', token)
        setToken(token)
        setUser(user)
        
        return { success: true }
      } else {
        return {
          success: false,
          message: response.data.message || 'Registration failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

