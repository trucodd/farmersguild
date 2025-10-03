import { createContext, useContext, useState, useEffect } from 'react'

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

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    const userEmail = localStorage.getItem('userEmail')
    console.log('AuthContext init - token:', !!token, 'userId:', userId, 'email:', userEmail)
    if (token && userId) {
      setUser({ 
        id: userId,
        email: userEmail,
        token 
      })
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email)
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      })
      
      console.log('Login response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('userId', data.user_id)
        localStorage.setItem('userEmail', email)
        setUser({ 
          id: data.user_id,
          email, 
          token: data.access_token 
        })
        return true
      } else {
        const error = await response.json()
        console.error('Login error response:', error)
        alert(`Login failed: ${error.detail || 'Unknown error'}`)
        throw new Error(error.detail || 'Login failed')
      }
    } catch (error) {
      console.error('Login failed:', error)
      if (!error.message.includes('Login failed:')) {
        alert('Network error. Please check if the server is running.')
      }
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    setUser(null)
  }

  const value = {
    user,
    login,
    logout,
    loading
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}