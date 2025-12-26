import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'

function Header() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      localStorage.removeItem('rememberMe')
      void navigate('/')
    } catch (err) {
      console.error('Logout failed:', err)
      // eslint-disable-next-line no-alert
      window.alert('Logout failed. Please try again.')
    }
  }

  return (
    <header
      style={{
        backgroundColor: '#1a1a2e',
        color: 'white',
        padding: '15px 40px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Logo/Title */}
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          style={{
            color: 'white',
            textDecoration: 'none',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          The Big Screen Club
        </Link>

        {/* Navigation */}
        <nav>
          {!isAuthenticated ? (
            // Logged out: Show Sign Up / Log In buttons
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => {
                  void navigate('/signup')
                }}
                style={{
                  padding: '8px 20px',
                  fontSize: '1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#218838'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#28a745'
                }}
              >
                Sign Up
              </button>
              <button
                onClick={() => {
                  void navigate('/login')
                }}
                style={{
                  padding: '8px 20px',
                  fontSize: '1rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0056b3'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#007bff'
                }}
              >
                Log In
              </button>
            </div>
          ) : (
            // Logged in: Show user menu dropdown
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen)
                }}
                onBlur={(e) => {
                  // Delay to allow clicking dropdown items
                  setTimeout(() => {
                    if (!e.currentTarget.contains(document.activeElement)) {
                      setIsDropdownOpen(false)
                    }
                  }, 150)
                }}
                style={{
                  padding: '8px 20px',
                  fontSize: '1rem',
                  backgroundColor: '#16213e',
                  color: 'white',
                  border: '2px solid #0f3460',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0f3460'
                  e.currentTarget.style.borderColor = '#007bff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#16213e'
                  e.currentTarget.style.borderColor = '#0f3460'
                }}
              >
                {user?.username ?? 'User'}
                <span
                  style={{
                    transition: 'transform 0.2s',
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                  }}
                >
                  ▾
                </span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    backgroundColor: 'white',
                    borderRadius: '5px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    minWidth: '180px',
                    overflow: 'hidden',
                    zIndex: 1000,
                  }}
                >
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false)
                      void navigate('/profile')
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      fontSize: '1rem',
                      backgroundColor: 'white',
                      color: '#333',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white'
                    }}
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false)
                      void navigate('/dashboard')
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      fontSize: '1rem',
                      backgroundColor: 'white',
                      color: '#333',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      borderTop: '1px solid #eee',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white'
                    }}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false)
                      void handleLogout()
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      fontSize: '1rem',
                      backgroundColor: 'white',
                      color: '#dc3545',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      borderTop: '1px solid #eee',
                      fontWeight: '600',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff5f5'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white'
                    }}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
