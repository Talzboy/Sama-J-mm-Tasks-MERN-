import React, { createContext, useState, useEffect, useContext } from 'react'
import { User, AuthContextType } from '../types'
import apiClient from '../api/client'

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        try {
          const response = await apiClient.get('/auth/me')
          setUser(response.data.user)
          setToken(storedToken)
        } catch {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password })
    const { token: newToken, user: newUser } = response.data
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  const register = async (username: string, email: string, password: string) => {
    const response = await apiClient.post('/auth/register', { username, email, password })
    const { token: newToken, user: newUser } = response.data
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
