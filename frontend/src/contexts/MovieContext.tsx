import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

import { movieApi } from '../api/movieApi'
import type { CurrentMovieState } from '../types/movie'

interface MovieContextType {
  currentMovieState: CurrentMovieState | null
  loading: boolean
  error: string | null
  refreshMovieState: (clubId: string) => Promise<void>
  clearMovieState: () => void
}

const MovieContext = createContext<MovieContextType | undefined>(undefined)

export function MovieProvider({ children }: { children: ReactNode }) {
  const [currentMovieState, setCurrentMovieState] =
    useState<CurrentMovieState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshMovieState = useCallback(async (clubId: string) => {
    setLoading(true)
    setError(null)
    try {
      const state = await movieApi.getCurrentMovieState(clubId)
      setCurrentMovieState(state)
    } catch (err) {
      console.error('Error refreshing movie state:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to refresh movie state'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const clearMovieState = useCallback(() => {
    setCurrentMovieState(null)
    setError(null)
  }, [])

  return (
    <MovieContext.Provider
      value={{
        currentMovieState,
        loading,
        error,
        refreshMovieState,
        clearMovieState,
      }}
    >
      {children}
    </MovieContext.Provider>
  )
}

export function useMovie() {
  const context = useContext(MovieContext)
  if (context === undefined) {
    throw new Error('useMovie must be used within a MovieProvider')
  }
  return context
}

