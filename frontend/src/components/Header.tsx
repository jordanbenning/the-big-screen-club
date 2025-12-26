import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { clubApi } from '../api/clubApi'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'

function Header() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { notifications, unreadCount, refreshNotifications } =
    useNotifications()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
    useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setActionLoading(invitationId)
      await clubApi.acceptInvitation(invitationId)
      await refreshNotifications()
      // eslint-disable-next-line no-alert
      window.alert('Invitation accepted! Club added to your list.')
    } catch (error) {
      console.error('Failed to accept invitation:', error)
      // eslint-disable-next-line no-alert
      window.alert('Failed to accept invitation. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      setActionLoading(invitationId)
      await clubApi.rejectInvitation(invitationId)
      await refreshNotifications()
    } catch (error) {
      console.error('Failed to reject invitation:', error)
      // eslint-disable-next-line no-alert
      window.alert('Failed to reject invitation. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  // Get up to 5 unread notifications for dropdown
  const unreadNotifications = notifications
    .filter((n) => !n.isRead && n.invitation.status === 'PENDING')
    .slice(0, 5)

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
            // Logged in: Show notification bell and user menu dropdown
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* Notification Bell */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    setIsNotificationDropdownOpen(!isNotificationDropdownOpen)
                  }}
                  onBlur={(e) => {
                    setTimeout(() => {
                      if (!e.currentTarget.contains(document.activeElement)) {
                        setIsNotificationDropdownOpen(false)
                      }
                    }, 150)
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '1.2rem',
                    backgroundColor: '#16213e',
                    color: 'white',
                    border: '2px solid #0f3460',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
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
                  🔔
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotificationDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      backgroundColor: 'white',
                      borderRadius: '5px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      minWidth: '350px',
                      maxWidth: '400px',
                      overflow: 'hidden',
                      zIndex: 1000,
                      maxHeight: '500px',
                      overflowY: 'auto',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid #eee',
                        fontWeight: 'bold',
                        color: '#333',
                      }}
                    >
                      Notifications
                    </div>

                    {unreadNotifications.length === 0 ? (
                      <div
                        style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: '#666',
                        }}
                      >
                        No new notifications
                      </div>
                    ) : (
                      unreadNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          style={{
                            padding: '15px 20px',
                            borderBottom: '1px solid #eee',
                            backgroundColor: notification.isRead
                              ? 'white'
                              : '#f8f9fa',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.9rem',
                              color: '#333',
                              marginBottom: '8px',
                            }}
                          >
                            <strong>
                              {notification.invitation.invitedBy.username}
                            </strong>{' '}
                            invited you to join{' '}
                            <strong>{notification.invitation.club.name}</strong>
                          </div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#999',
                              marginBottom: '8px',
                            }}
                          >
                            {getTimeAgo(notification.createdAt)}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                void handleAcceptInvitation(
                                  notification.invitation.id
                                )
                              }}
                              disabled={
                                actionLoading === notification.invitation.id
                              }
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.8rem',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor:
                                  actionLoading === notification.invitation.id
                                    ? 'not-allowed'
                                    : 'pointer',
                                opacity:
                                  actionLoading === notification.invitation.id
                                    ? 0.6
                                    : 1,
                              }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => {
                                void handleRejectInvitation(
                                  notification.invitation.id
                                )
                              }}
                              disabled={
                                actionLoading === notification.invitation.id
                              }
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.8rem',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor:
                                  actionLoading === notification.invitation.id
                                    ? 'not-allowed'
                                    : 'pointer',
                                opacity:
                                  actionLoading === notification.invitation.id
                                    ? 0.6
                                    : 1,
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}

                    <button
                      onClick={() => {
                        setIsNotificationDropdownOpen(false)
                        void navigate('/notifications')
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        fontSize: '0.9rem',
                        backgroundColor: 'white',
                        color: '#007bff',
                        border: 'none',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        fontWeight: '600',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                      }}
                    >
                      View All Notifications
                    </button>
                  </div>
                )}
              </div>

              {/* User Menu */}
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
                      transform: isDropdownOpen
                        ? 'rotate(180deg)'
                        : 'rotate(0)',
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
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
