import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkAuth } = useAuth()

  // Only check auth when this protected route is accessed
  useEffect(() => {
    void checkAuth()
  }, [checkAuth])

  // While checking authentication, show nothing (silent)
  if (isLoading) {
    return null
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // User is authenticated, show the protected content
  return children
}

export default ProtectedRoute
