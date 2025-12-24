import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import { sessionHelper } from '../utils/sessionHelper'

interface PublicOnlyRouteProps {
  children: ReactNode
}

function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, isLoading, checkAuth } = useAuth()

  // Only check auth if we think user might be logged in
  // This prevents 401 errors for logged-out users
  useEffect(() => {
    if (sessionHelper.isLikelyLoggedIn()) {
      void checkAuth()
    }
  }, [checkAuth])

  // While checking authentication, show nothing (silent)
  if (isLoading) {
    return null
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // User is not authenticated, show the public content
  return children
}

export default PublicOnlyRoute
