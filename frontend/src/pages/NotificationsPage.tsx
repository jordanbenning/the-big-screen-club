import { useState } from 'react'

import { clubApi } from '../api/clubApi'
import InlineAlert from '../components/InlineAlert'
import { useClubs } from '../contexts/ClubContext'
import { useNotifications } from '../contexts/NotificationContext'

function NotificationsPage() {
  const { notifications, markAllAsRead, refreshNotifications } =
    useNotifications()
  const { refreshClubs } = useClubs()
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [alert, setAlert] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setActionLoading(invitationId)
      await clubApi.acceptInvitation(invitationId)
      await Promise.all([refreshNotifications(), refreshClubs()])
      setAlert({
        type: 'success',
        message: 'Invitation accepted! Club added to your list.',
      })
    } catch (error) {
      console.error('Failed to accept invitation:', error)
      setAlert({
        type: 'error',
        message: 'Failed to accept invitation. Please try again.',
      })
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
      setAlert({
        type: 'error',
        message: 'Failed to reject invitation. Please try again.',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      setAlert({
        type: 'error',
        message: 'Failed to mark all as read. Please try again.',
      })
    }
  }

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  const getFullDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.isRead
    if (filter === 'read') return notification.isRead
    return true
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        <h1 style={{ margin: 0 }}>Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => {
              void handleMarkAllAsRead()
            }}
            style={{
              padding: '10px 20px',
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
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
        {(['all', 'unread', 'read'] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => {
              setFilter(filterType)
            }}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              backgroundColor: filter === filterType ? '#007bff' : '#f8f9fa',
              color: filter === filterType ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            {filterType === 'unread' && unreadCount > 0 && (
              <span
                style={{
                  marginLeft: '8px',
                  backgroundColor: filter === filterType ? 'white' : '#dc3545',
                  color: filter === filterType ? '#007bff' : 'white',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alert for notification actions */}
      {alert !== null && (
        <InlineAlert
          type={alert.type}
          message={alert.message}
          onDismiss={() => {
            setAlert(null)
          }}
        />
      )}

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666',
          }}
        >
          <p style={{ fontSize: '1.2rem', margin: 0 }}>
            No {filter !== 'all' ? filter : ''} notifications
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredNotifications.map((notification) => {
            const isPending =
              notification.invitation.status === 'PENDING' &&
              new Date(notification.invitation.expiresAt) > new Date()
            const isExpired =
              notification.invitation.status === 'PENDING' &&
              new Date(notification.invitation.expiresAt) <= new Date()

            return (
              <div
                key={notification.id}
                style={{
                  backgroundColor: notification.isRead ? 'white' : '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  border: notification.isRead
                    ? '1px solid #dee2e6'
                    : '2px solid #007bff',
                  opacity: notification.isRead ? 0.8 : 1,
                  display: 'flex',
                  gap: '20px',
                }}
              >
                {/* Club Profile Picture */}
                <div style={{ flexShrink: 0 }}>
                  {notification.invitation.club.profilePictureUrl !== null ? (
                    <img
                      src={`http://localhost:3000${notification.invitation.club.profilePictureUrl}`}
                      alt={notification.invitation.club.name}
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        backgroundColor: '#dee2e6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                      }}
                    >
                      🎬
                    </div>
                  )}
                </div>

                {/* Notification Content */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: '#333',
                    }}
                  >
                    Club Invitation
                  </div>
                  <div style={{ marginBottom: '8px', color: '#555' }}>
                    <strong>
                      {notification.invitation.invitedBy.username}
                    </strong>{' '}
                    invited you to join{' '}
                    <strong>{notification.invitation.club.name}</strong>
                  </div>
                  {notification.invitation.club.description !== null && (
                    <div
                      style={{
                        marginBottom: '8px',
                        color: '#666',
                        fontSize: '0.9rem',
                      }}
                    >
                      {notification.invitation.club.description}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: '#999',
                      marginBottom: '12px',
                    }}
                  >
                    {getTimeAgo(notification.createdAt)} •{' '}
                    {getFullDate(notification.createdAt)}
                  </div>

                  {/* Status Badge */}
                  <div style={{ marginBottom: '12px' }}>
                    {notification.invitation.status === 'ACCEPTED' && (
                      <span
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                        }}
                      >
                        ✓ Accepted
                      </span>
                    )}
                    {notification.invitation.status === 'REJECTED' && (
                      <span
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                        }}
                      >
                        ✗ Rejected
                      </span>
                    )}
                    {isExpired && (
                      <span
                        style={{
                          backgroundColor: '#6c757d',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                        }}
                      >
                        Expired
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {isPending && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => {
                          void handleAcceptInvitation(
                            notification.invitation.id
                          )
                        }}
                        disabled={actionLoading === notification.invitation.id}
                        style={{
                          padding: '10px 20px',
                          fontSize: '1rem',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor:
                            actionLoading === notification.invitation.id
                              ? 'not-allowed'
                              : 'pointer',
                          fontWeight: '600',
                          transition: 'background-color 0.2s',
                          opacity:
                            actionLoading === notification.invitation.id
                              ? 0.6
                              : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (actionLoading !== notification.invitation.id) {
                            e.currentTarget.style.backgroundColor = '#218838'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#28a745'
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
                        disabled={actionLoading === notification.invitation.id}
                        style={{
                          padding: '10px 20px',
                          fontSize: '1rem',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor:
                            actionLoading === notification.invitation.id
                              ? 'not-allowed'
                              : 'pointer',
                          fontWeight: '600',
                          transition: 'background-color 0.2s',
                          opacity:
                            actionLoading === notification.invitation.id
                              ? 0.6
                              : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (actionLoading !== notification.invitation.id) {
                            e.currentTarget.style.backgroundColor = '#c82333'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#dc3545'
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
