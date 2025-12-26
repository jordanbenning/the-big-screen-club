import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { authApi } from '../../api/authApi'
import { useAuth } from '../../contexts/AuthContext'
import ResetPasswordPage from '../ResetPasswordPage'

// Mock authApi
vi.mock('../../api/authApi')

// Mock useAuth
vi.mock('../../contexts/AuthContext')

// Mock useNavigate and useSearchParams
const mockNavigate = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  }
})

const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  isVerified: true,
  createdAt: '2024-01-01',
}

describe('ResetPasswordPage', () => {
  const mockLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.delete('token')

    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: vi.fn(),
      clearUser: vi.fn(),
      checkAuth: vi.fn(),
      updateUser: vi.fn(),
    })
  })

  it('should render the reset password form with valid token', () => {
    mockSearchParams.set('token', 'valid-token-123')

    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    expect(
      screen.getByRole('heading', { name: /reset password/i })
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /reset password/i })
    ).toBeInTheDocument()
  })

  it('should show error when token is missing', () => {
    // No token in search params
    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument()
    expect(
      screen.getByText(/invalid or missing reset token/i)
    ).toBeInTheDocument()
  })

  it('should validate password strength', async () => {
    const user = userEvent.setup()
    mockSearchParams.set('token', 'valid-token-123')

    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', {
      name: /reset password/i,
    })

    // Enter weak password
    await user.type(passwordInput, 'weak')
    await user.type(confirmInput, 'weak')
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument()
    })

    expect(authApi.resetPassword).not.toHaveBeenCalled()
  })

  it('should validate passwords match', async () => {
    const user = userEvent.setup()
    mockSearchParams.set('token', 'valid-token-123')

    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', {
      name: /reset password/i,
    })

    // Enter mismatched passwords
    await user.type(passwordInput, 'ValidPass123')
    await user.type(confirmInput, 'DifferentPass456')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })

    expect(authApi.resetPassword).not.toHaveBeenCalled()
  })

  it('should call resetPassword API with valid data', async () => {
    const user = userEvent.setup()
    mockSearchParams.set('token', 'valid-token-123')

    vi.mocked(authApi.resetPassword).mockResolvedValue({
      message: 'Password reset successful',
      user: mockUser,
    })

    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', {
      name: /reset password/i,
    })

    await user.type(passwordInput, 'NewPassword123')
    await user.type(confirmInput, 'NewPassword123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith({
        token: 'valid-token-123',
        password: 'NewPassword123',
      })
    })
  })

  it('should auto-login and redirect to dashboard on success', async () => {
    const user = userEvent.setup()
    mockSearchParams.set('token', 'valid-token-123')

    vi.mocked(authApi.resetPassword).mockResolvedValue({
      message: 'Password reset successful',
      user: mockUser,
    })

    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', {
      name: /reset password/i,
    })

    await user.type(passwordInput, 'NewPassword123')
    await user.type(confirmInput, 'NewPassword123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(mockUser)
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should display error message on API failure', async () => {
    const user = userEvent.setup()
    mockSearchParams.set('token', 'expired-token')

    vi.mocked(authApi.resetPassword).mockRejectedValue({
      response: {
        data: {
          error: 'Reset token has expired',
        },
      },
    })

    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', {
      name: /reset password/i,
    })

    await user.type(passwordInput, 'NewPassword123')
    await user.type(confirmInput, 'NewPassword123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/reset token has expired/i)).toBeInTheDocument()
    })
  })

  it('should disable buttons while loading', async () => {
    const user = userEvent.setup()
    mockSearchParams.set('token', 'valid-token-123')

    vi.mocked(authApi.resetPassword).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                message: 'Success',
                user: mockUser,
              }),
            100
          )
        })
    )

    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', {
      name: /reset password/i,
    })

    await user.type(passwordInput, 'NewPassword123')
    await user.type(confirmInput, 'NewPassword123')
    await user.click(submitButton)

    // Buttons should be disabled during loading
    expect(
      screen.getByRole('button', { name: /resetting password/i })
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: /back to login/i })
    ).toBeDisabled()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should navigate back to login when Back to Login is clicked', async () => {
    const user = userEvent.setup()
    mockSearchParams.set('token', 'valid-token-123')

    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    const backButton = screen.getByRole('button', { name: /back to login/i })
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('should clear error message when user types', async () => {
    const user = userEvent.setup()
    mockSearchParams.set('token', 'valid-token-123')

    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', {
      name: /reset password/i,
    })

    // Trigger validation error
    await user.type(passwordInput, 'weak')
    await user.type(confirmInput, 'weak')
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument()
    })

    // Clear and retype
    await user.clear(passwordInput)
    await user.type(passwordInput, 'StrongPassword123')

    // Error should be cleared
    expect(
      screen.queryByText(/password must be at least 8 characters/i)
    ).not.toBeInTheDocument()
  })

  it('should show password requirements hint', () => {
    mockSearchParams.set('token', 'valid-token-123')

    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )

    expect(
      screen.getByText(
        /must be at least 8 characters with uppercase, lowercase, and number/i
      )
    ).toBeInTheDocument()
  })
})
