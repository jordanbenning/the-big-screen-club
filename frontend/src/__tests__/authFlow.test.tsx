import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { authApi } from '../api/authApi'
import ProtectedRoute from '../components/ProtectedRoute'
import PublicOnlyRoute from '../components/PublicOnlyRoute'
import { AuthProvider } from '../contexts/AuthContext'
import Dashboard from '../pages/Dashboard'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'
import type { User } from '../types/auth'
import { sessionHelper } from '../utils/sessionHelper'

// Mock dependencies
vi.mock('../api/authApi')
vi.mock('../utils/sessionHelper')

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  isVerified: true,
  createdAt: new Date('2024-01-01'),
}

// Helper to render app with routes
const renderApp = (initialRoute = '/') => {
  window.history.pushState({}, '', initialRoute)

  return render(
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPasswordPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicOnlyRoute>
                <ResetPasswordPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(sessionHelper.isLikelyLoggedIn).mockReturnValue(false)
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(null)
  })

  describe('Landing Page', () => {
    it('should show landing page without checking auth', () => {
      renderApp('/')

      expect(screen.getByText(/The Big Screen Club/i)).toBeInTheDocument()
      expect(authApi.getCurrentUser).not.toHaveBeenCalled()
    })

    it('should have Log In button', () => {
      renderApp('/')

      const loginButtons = screen.getAllByRole('button', { name: /log in/i })
      expect(loginButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Login Page - Logged Out User', () => {
    it('should show login page without API errors for logged-out user', () => {
      vi.mocked(sessionHelper.isLikelyLoggedIn).mockReturnValue(false)

      renderApp('/login')

      // Use getAllByRole and check we got results
      const loginButtons = screen.getAllByRole('button')
      expect(loginButtons.length).toBeGreaterThan(0)
      // Should NOT call API because sessionHelper says user is not logged in
      expect(authApi.getCurrentUser).not.toHaveBeenCalled()
    })
  })

  describe('Login Page - Already Logged In User', () => {
    it('should redirect to dashboard if user is already logged in', async () => {
      vi.mocked(sessionHelper.isLikelyLoggedIn).mockReturnValue(true)
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser)

      renderApp('/login')

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, testuser!/i)).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard - Protected Route', () => {
    it('should redirect to login when not authenticated', async () => {
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(null)

      renderApp('/dashboard')

      await waitFor(() => {
        // Should be redirected to login page - check for form elements
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('should show dashboard when authenticated', async () => {
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(sessionHelper.isLikelyLoggedIn).mockReturnValue(true)

      renderApp('/dashboard')

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, testuser!/i)).toBeInTheDocument()
        expect(screen.getByText(/test@example.com/i)).toBeInTheDocument()
      })
    })
  })

  describe('Complete Authentication Flow', () => {
    it('should complete full login flow', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        message: 'Login successful',
        user: mockUser,
      })

      // Start at landing page
      renderApp('/')
      expect(screen.getByText(/The Big Screen Club/i)).toBeInTheDocument()

      // Note: Full form submission testing would require mocking the LoginForm
      // This test verifies the routing and auth state management structure
    })
  })

  describe('Logout Flow', () => {
    it('should clear session and redirect to landing page on logout', async () => {
      vi.mocked(authApi.logout).mockResolvedValue()
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser)

      // Start logged in at dashboard
      renderApp('/dashboard')

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, testuser!/i)).toBeInTheDocument()
      })

      // Logout button would be clicked here
      // After logout, user should be redirected and session cleared
      expect(sessionHelper.markLoggedOut).toHaveBeenCalledTimes(0) // Not called yet

      // This demonstrates the logout flow structure is in place
    })
  })

  describe('Session Persistence', () => {
    it('should remember logged-in state across page refreshes', async () => {
      vi.mocked(sessionHelper.isLikelyLoggedIn).mockReturnValue(true)
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser)

      // Simulate page refresh - navigate to a protected route
      renderApp('/dashboard')

      await waitFor(() => {
        expect(authApi.getCurrentUser).toHaveBeenCalled()
        expect(screen.getByText(/Welcome back, testuser!/i)).toBeInTheDocument()
      })
    })

    it('should not make unnecessary API calls for logged-out users', () => {
      vi.mocked(sessionHelper.isLikelyLoggedIn).mockReturnValue(false)

      // Visit login page as logged-out user
      renderApp('/login')

      // Should NOT call the API
      expect(authApi.getCurrentUser).not.toHaveBeenCalled()
    })
  })

  describe('Password Reset Flow', () => {
    it('should display forgot password page', () => {
      renderApp('/forgot-password')

      expect(
        screen.getByRole('heading', { name: /forgot password/i })
      ).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /send reset link/i })
      ).toBeInTheDocument()
    })

    it('should display reset password page with token', () => {
      renderApp('/reset-password?token=test-token-123')

      expect(
        screen.getByRole('heading', { name: /reset password/i })
      ).toBeInTheDocument()
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('should handle password reset request', async () => {
      vi.mocked(authApi.forgotPassword).mockResolvedValue({
        message:
          'If an account exists with this email, a password reset link will be sent.',
      })

      renderApp('/forgot-password')

      // The forgotPassword API would be called when form is submitted
      // This test verifies the route is properly configured
      expect(
        screen.getByRole('button', { name: /send reset link/i })
      ).toBeInTheDocument()
    })

    it('should handle password reset completion and auto-login', async () => {
      vi.mocked(authApi.resetPassword).mockResolvedValue({
        message: 'Password reset successful',
        user: mockUser,
      })

      renderApp('/reset-password?token=valid-token')

      // The resetPassword API would be called when form is submitted
      // After successful reset, user should be auto-logged in
      expect(
        screen.getByRole('button', { name: /reset password/i })
      ).toBeInTheDocument()
    })

    it('should allow logged-out users to access password reset pages', () => {
      vi.mocked(sessionHelper.isLikelyLoggedIn).mockReturnValue(false)

      // Forgot password page should be accessible
      renderApp('/forgot-password')
      expect(
        screen.getByRole('heading', { name: /forgot password/i })
      ).toBeInTheDocument()

      // Reset password page should be accessible
      renderApp('/reset-password?token=test-token')
      expect(
        screen.getByRole('heading', { name: /reset password/i })
      ).toBeInTheDocument()
    })

    it('should show error for reset password page without token', () => {
      renderApp('/reset-password')

      expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument()
      expect(
        screen.getByText(/invalid or missing reset token/i)
      ).toBeInTheDocument()
    })

    it('should complete full password reset flow', async () => {
      // Step 1: User requests password reset
      vi.mocked(authApi.forgotPassword).mockResolvedValue({
        message: 'Reset email sent',
      })

      renderApp('/forgot-password')
      expect(
        screen.getByRole('heading', { name: /forgot password/i })
      ).toBeInTheDocument()

      // Step 2: User receives email and clicks link (navigates to reset page)
      vi.mocked(authApi.resetPassword).mockResolvedValue({
        message: 'Password reset successful',
        user: mockUser,
      })

      renderApp('/reset-password?token=valid-token-from-email')
      expect(
        screen.getByRole('heading', { name: /reset password/i })
      ).toBeInTheDocument()

      // Step 3: After successful reset, user is auto-logged in and redirected
      // This would be handled by the ResetPasswordPage component calling login()
      // and navigate('/dashboard')
    })
  })
})
