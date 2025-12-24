import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useAuth } from '../../contexts/AuthContext'
import { sessionHelper } from '../../utils/sessionHelper'
import PublicOnlyRoute from '../PublicOnlyRoute'

// Mock dependencies
vi.mock('../../contexts/AuthContext')
vi.mock('../../utils/sessionHelper')

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => {
      mockNavigate(to)
      return <div data-testid="navigate">{`Redirecting to ${to}`}</div>
    },
  }
})

describe('PublicOnlyRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show nothing while loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    })
    vi.mocked(sessionHelper.isLikelyLoggedIn).mockReturnValue(false)

    const { container } = render(
      <BrowserRouter>
        <PublicOnlyRoute>
          <div>Public Content</div>
        </PublicOnlyRoute>
      </BrowserRouter>
    )

    expect(container.firstChild).toBeNull()
  })

  it('should redirect to dashboard when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        isVerified: true,
        createdAt: new Date(),
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    })
    vi.mocked(sessionHelper.isLikelyLoggedIn).mockReturnValue(true)

    render(
      <BrowserRouter>
        <PublicOnlyRoute>
          <div>Public Content</div>
        </PublicOnlyRoute>
      </BrowserRouter>
    )

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('should show public content when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    })
    vi.mocked(sessionHelper.isLikelyLoggedIn).mockReturnValue(false)

    render(
      <BrowserRouter>
        <PublicOnlyRoute>
          <div>Public Content</div>
        </PublicOnlyRoute>
      </BrowserRouter>
    )

    expect(screen.getByText('Public Content')).toBeInTheDocument()
  })

  it('should only call checkAuth if user is likely logged in', () => {
    const mockCheckAuth = vi.fn()
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: mockCheckAuth,
    })
    vi.mocked(sessionHelper.isLikelyLoggedIn).mockReturnValue(false)

    render(
      <BrowserRouter>
        <PublicOnlyRoute>
          <div>Public Content</div>
        </PublicOnlyRoute>
      </BrowserRouter>
    )

    // Should NOT call checkAuth since isLikelyLoggedIn is false
    expect(mockCheckAuth).not.toHaveBeenCalled()
  })

  it('should call checkAuth if user is likely logged in', () => {
    const mockCheckAuth = vi.fn()
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: mockCheckAuth,
    })
    vi.mocked(sessionHelper.isLikelyLoggedIn).mockReturnValue(true)

    render(
      <BrowserRouter>
        <PublicOnlyRoute>
          <div>Public Content</div>
        </PublicOnlyRoute>
      </BrowserRouter>
    )

    // SHOULD call checkAuth since isLikelyLoggedIn is true
    expect(mockCheckAuth).toHaveBeenCalled()
  })
})
