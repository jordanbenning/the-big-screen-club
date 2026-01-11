import React, { createContext, useContext, useEffect, useState } from 'react'

import { authApi } from '../api/authApi'
import type { User } from '../types/auth'
import { sessionHelper } from '../utils/sessionHelper'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (user: User) => void
  logout: () => Promise<void>
  clearUser: () => void
  checkAuth: () => Promise<void>

  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start as true
  const [hasChecked, setHasChecked] = useState(false)

  const checkAuth = async () => {
    if (hasChecked) return // Don't check again if we already did

    setIsLoading(true)
    try {
      const userData = await authApi.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('Failed to check authentication status:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
      setHasChecked(true)
    }
  }

  // Check auth on mount
  useEffect(() => {
    void checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = (userData: User) => {
    setUser(userData)
    setHasChecked(true)
    sessionHelper.markLoggedIn()
  }

  const logout = async () => {
    try {
      await authApi.logout()
      setUser(null)
      sessionHelper.markLoggedOut()
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    }
  }

  const clearUser = () => {
    setUser(null)
    sessionHelper.markLoggedOut()
  }

  const updateUser = (userData: User) => {
    setUser(userData)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    clearUser,
    checkAuth,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
