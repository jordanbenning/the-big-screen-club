import React, { createContext, useContext, useState } from 'react'

import { authApi } from '../api/authApi'
import type { User } from '../types/auth'
import { sessionHelper } from '../utils/sessionHelper'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  // eslint-disable-next-line no-unused-vars
  login: (user: User) => void
  logout: () => Promise<void>
  clearUser: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    clearUser,
    checkAuth,
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
