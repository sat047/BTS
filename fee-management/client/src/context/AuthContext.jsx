import React, { createContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [adminEmail, setAdminEmail] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, check localStorage for existing token
  useEffect(() => {
    const savedToken = localStorage.getItem('fee_token')
    const savedEmail = localStorage.getItem('fee_admin_email')
    
    if (savedToken && savedEmail) {
      setToken(savedToken)
      setAdminEmail(savedEmail)
    }
    
    setLoading(false)
  }, [])

  const login = (newToken) => {
    try {
      const decoded = jwtDecode(newToken)
      localStorage.setItem('fee_token', newToken)
      localStorage.setItem('fee_admin_email', decoded.email)
      setToken(newToken)
      setAdminEmail(decoded.email)
    } catch (error) {
      console.error('Failed to decode token:', error)
    }
  }

  const logout = () => {
    localStorage.removeItem('fee_token')
    localStorage.removeItem('fee_admin_email')
    setToken(null)
    setAdminEmail(null)
  }

  return (
    <AuthContext.Provider value={{ token, adminEmail, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
