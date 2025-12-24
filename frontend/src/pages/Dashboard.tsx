import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { authApi } from '../api/authApi'
import { useAuth } from '../contexts/AuthContext'

function Dashboard() {
  const navigate = useNavigate()
  const { user, logout, clearUser } = useAuth()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleLogout = () => {
    void (async () => {
      try {
        await logout()
        // Clear remember me preference
        localStorage.removeItem('rememberMe')
        // Redirect to landing page
        void navigate('/')
      } catch (err) {
        console.error('Logout failed:', err)
        // eslint-disable-next-line no-alert
        window.alert('Logout failed. Please try again.')
      }
    })()
  }

  const handleDeleteAccount = () => {
    setDeleteLoading(true)
    setDeleteError(null)

    void (async () => {
      try {
        await authApi.deleteAccount(deletePassword)
        // Account deleted successfully
        // Session is already destroyed on the backend, so just clear local state
        // Don't call logout() as it would make an API call that would fail
        localStorage.removeItem('rememberMe')
        clearUser()
        // Use window.location for a hard redirect to ensure clean state
        window.location.href = '/'
      } catch (err) {
        if (err instanceof Error && 'response' in err) {
          const axiosError = err as {
            response?: { data?: { error?: string } }
          }
          setDeleteError(
            axiosError.response?.data?.error ?? 'Failed to delete account'
          )
        } else {
          setDeleteError('Failed to delete account')
        }
      } finally {
        setDeleteLoading(false)
      }
    })()
  }

  // User data comes from AuthContext, no need for loading or error states
  // ProtectedRoute already handles authentication check

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
        }}
      >
        <h1>Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Log Out
        </button>
      </div>

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

          <div
            style={{
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Your Profile</h3>
            <div style={{ marginTop: '20px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px 1fr',
                  gap: '15px',
                  fontSize: '1rem',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>Username:</div>
                <div>{user.username}</div>

                <div style={{ fontWeight: 'bold' }}>Email:</div>
                <div>{user.email}</div>

                <div style={{ fontWeight: 'bold' }}>Status:</div>
                <div>
                  {user.isVerified ? (
                    <span style={{ color: '#28a745' }}>✓ Verified</span>
                  ) : (
                    <span style={{ color: '#ffc107' }}>⚠ Not Verified</span>
                  )}
                </div>

                <div style={{ fontWeight: 'bold' }}>Member Since:</div>
                <div>
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#e7f3ff',
              borderRadius: '8px',
              border: '1px solid #b3d7ff',
            }}
          >
            <h3 style={{ marginTop: 0, color: '#004085' }}>🎬 Coming Soon!</h3>
            <p style={{ color: '#004085', margin: 0 }}>
              Movie clubs, voting, and rating features are on their way. Stay
              tuned!
            </p>
          </div>

          {/* Delete Account Section */}
          <div
            style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#fff5f5',
              borderRadius: '8px',
              border: '1px solid #feb2b2',
            }}
          >
            <h3 style={{ marginTop: 0, color: '#c53030' }}>⚠️ Danger Zone</h3>
            <p style={{ color: '#742a2a', marginBottom: '15px' }}>
              Once you delete your account, there is no going back. This action
              cannot be undone.
            </p>
            <button
              onClick={() => {
                setShowDeleteModal(true)
              }}
              style={{
                padding: '10px 20px',
                fontSize: '1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Delete Account
            </button>
          </div>
        </>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
            }}
          >
            <h2 style={{ marginTop: 0, color: '#c53030' }}>Delete Account?</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              This action cannot be undone. All your data will be permanently
              deleted. Please enter your password to confirm.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="deletePassword"
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Password
              </label>
              <input
                type="password"
                id="deletePassword"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value)
                  setDeleteError(null)
                }}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                }}
              />
            </div>

            {deleteError !== null && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#fee',
                  color: '#c33',
                  borderRadius: '5px',
                  marginBottom: '20px',
                }}
              >
                {deleteError}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletePassword('')
                  setDeleteError(null)
                }}
                disabled={deleteLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: '1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deletePassword.trim() === ''}
                style={{
                  padding: '10px 20px',
                  fontSize: '1rem',
                  backgroundColor:
                    deleteLoading || deletePassword.trim() === ''
                      ? '#ccc'
                      : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor:
                    deleteLoading || deletePassword.trim() === ''
                      ? 'not-allowed'
                      : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
