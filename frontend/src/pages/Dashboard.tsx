import { useState } from 'react'

import { clubApi } from '../api/clubApi'
import ClubList from '../components/ClubList'
import InlineAlert from '../components/InlineAlert'
import { useAuth } from '../contexts/AuthContext'
import { useClubs } from '../contexts/ClubContext'
import { useNotifications } from '../contexts/NotificationContext'

function Dashboard() {
  const { user } = useAuth()
  const { notifications, refreshNotifications } = useNotifications()
  const { refreshClubs } = useClubs()
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

  // Get pending invitations
  const pendingInvitations = notifications.filter(
    (n) =>
      n.invitation.status === 'PENDING' &&
      new Date(n.invitation.expiresAt) > new Date()
  )

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '40px' }}>Dashboard</h1>

      {user !== null && (
        <>
          <div
            style={{
              backgroundColor: '#f8f9fa',
              padding: '30px',
              borderRadius: '8px',
              marginBottom: '30px',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Welcome back, {user.username}! 👋</h2>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>
              You&apos;re successfully logged in to The Big Screen Club.
            </p>
          </div>

          {/* Pending Invitations Section */}
          {pendingInvitations.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ marginBottom: '20px' }}>
                Pending Invitations ({pendingInvitations.length})
              </h2>

              {/* Alert for invitation actions */}
              {alert !== null && (
                <InlineAlert
                  type={alert.type}
                  message={alert.message}
                  onDismiss={() => {
                    setAlert(null)
                  }}
                />
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '20px',
                }}
              >
                {pendingInvitations.map((notification) => (
                  <div
                    key={notification.id}
                    style={{
                      backgroundColor: 'white',
                      padding: '20px',
                      borderRadius: '8px',
                      border: '2px solid #007bff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {/* Club Profile Picture */}
                    <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                      {notification.invitation.club.profilePictureUrl !==
                      null ? (
                        <img
                          src={`http://localhost:3000${notification.invitation.club.profilePictureUrl}`}
                          alt={notification.invitation.club.name}
                          style={{
                            width: '100%',
                            height: '150px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '150px',
                            borderRadius: '8px',
                            backgroundColor: '#dee2e6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                          }}
                        >
                          🎬
                        </div>
                      )}
                    </div>

                    {/* Club Name */}
                    <h3
                      style={{
                        margin: '0 0 10px 0',
                        fontSize: '1.3rem',
                        color: '#333',
                      }}
                    >
                      {notification.invitation.club.name}
                    </h3>

                    {/* Club Description */}
                    {notification.invitation.club.description !== null && (
                      <p
                        style={{
                          margin: '0 0 10px 0',
                          color: '#666',
                          fontSize: '0.9rem',
                        }}
                      >
                        {notification.invitation.club.description}
                      </p>
                    )}

                    {/* Invited By */}
                    <p
                      style={{
                        margin: '0 0 10px 0',
                        color: '#666',
                        fontSize: '0.9rem',
                      }}
                    >
                      Invited by{' '}
                      <strong>
                        {notification.invitation.invitedBy.username}
                      </strong>
                    </p>

                    {/* Time */}
                    <p
                      style={{
                        margin: '0 0 15px 0',
                        color: '#999',
                        fontSize: '0.8rem',
                      }}
                    >
                      {getTimeAgo(notification.createdAt)}
                    </p>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => {
                          void handleAcceptInvitation(
                            notification.invitation.id
                          )
                        }}
                        disabled={actionLoading === notification.invitation.id}
                        style={{
                          flex: 1,
                          padding: '10px',
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
                          flex: 1,
                          padding: '10px',
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Movie Clubs Section */}
          <div
            style={{
              marginBottom: '30px',
            }}
          >
            <ClubList />
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
