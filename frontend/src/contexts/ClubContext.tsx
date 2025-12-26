import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'

import { clubApi } from '../api/clubApi'
import type { Club } from '../types/club'

import { useAuth } from './AuthContext'

interface ClubContextType {
  clubs: Club[]
  isLoading: boolean
  refreshClubs: () => Promise<void>
}

const ClubContext = createContext<ClubContextType | null>(null)

export const useClubs = () => {
  const context = useContext(ClubContext)
  if (context === null) {
    throw new Error('useClubs must be used within a ClubProvider')
  }
  return context
}

interface ClubProviderProps {
  children: React.ReactNode
}

export const ClubProvider: React.FC<ClubProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [clubs, setClubs] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshClubs = useCallback(async () => {
    if (!isAuthenticated) {
      setClubs([])
      return
    }

    try {
      setIsLoading(true)
      const data = await clubApi.getUserClubs()
      setClubs(data)
    } catch (error) {
      console.error('Failed to fetch clubs:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Initial fetch when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      void refreshClubs()
    } else {
      setClubs([])
    }
  }, [isAuthenticated, refreshClubs])

  const value: ClubContextType = {
    clubs,
    isLoading,
    refreshClubs,
  }

  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>
}
