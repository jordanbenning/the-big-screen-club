import type { ChangeEvent } from 'react'
import { useState } from 'react'

import { authApi } from '../api/authApi'
import { useAuth } from '../contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function ProfilePage() {
  const { user, updateUser, clearUser } = useAuth()

  // Profile update state
  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Password update state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pictureError, setPictureError] = useState<string | null>(null)
  const [pictureSuccess, setPictureSuccess] = useState<string | null>(null)
  const [pictureLoading, setPictureLoading] = useState(false)

  const handleProfileUpdate = () => {
    setProfileLoading(true)
    setProfileError(null)
    setProfileSuccess(null)

    void (async () => {
      try {
        const updates: { username?: string; email?: string } = {}

        if (username !== user?.username) {
          updates.username = username
        }
        if (email !== user?.email) {
          updates.email = email
        }

        if (Object.keys(updates).length === 0) {
          setProfileError('No changes to save')
          setProfileLoading(false)
          return
        }

        const response = await authApi.updateProfile(updates)
        updateUser(response.user)
        setProfileSuccess('Profile updated successfully!')
      } catch (err) {
        if (err instanceof Error && 'response' in err) {
          const axiosError = err as {
            response?: { data?: { error?: string } }
          }
          setProfileError(
            axiosError.response?.data?.error ?? 'Failed to update profile'
          )
        } else {
          setProfileError('Failed to update profile')
        }
      } finally {
        setProfileLoading(false)
      }
    })()
  }

  const handlePasswordUpdate = () => {
    setPasswordError(null)
    setPasswordSuccess(null)

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setPasswordLoading(true)

    void (async () => {
      try {
        const response = await authApi.updatePassword({
          currentPassword,
          newPassword,
        })
        setPasswordSuccess(response.message)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } catch (err) {
        if (err instanceof Error && 'response' in err) {
          const axiosError = err as {
            response?: { data?: { error?: string } }
          }
          setPasswordError(
            axiosError.response?.data?.error ?? 'Failed to update password'
          )
        } else {
          setPasswordError('Failed to update password')
        }
      } finally {
        setPasswordLoading(false)
      }
    })()
  }

  const handleDeleteAccount = () => {
    setDeleteLoading(true)
    setDeleteError(null)

    void (async () => {
      try {
        await authApi.deleteAccount(deletePassword)
        localStorage.removeItem('rememberMe')
        clearUser()
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setPictureError(null)
    setPictureSuccess(null)

    if (file === undefined) {
      setProfilePicture(null)
      setPreviewUrl(null)
      return
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setPictureError('Only JPEG and PNG images are allowed')
      setProfilePicture(null)
      setPreviewUrl(null)
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPictureError('File size must be less than 5MB')
      setProfilePicture(null)
      setPreviewUrl(null)
      return
    }

    setProfilePicture(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleProfilePictureUpload = () => {
    if (profilePicture === null) {
      setPictureError('Please select a profile picture')
      return
    }

    setPictureLoading(true)
    setPictureError(null)
    setPictureSuccess(null)

    void (async () => {
      try {
        const response = await authApi.updateProfilePicture(profilePicture)
        updateUser(response.user)
        setPictureSuccess('Profile picture updated successfully!')
        setProfilePicture(null)
        setPreviewUrl(null)
      } catch (err) {
        if (err instanceof Error && 'response' in err) {
          const axiosError = err as {
            response?: { data?: { error?: string } }
          }
          setPictureError(
            axiosError.response?.data?.error ??
              'Failed to update profile picture'
          )
        } else {
          setPictureError('Failed to update profile picture')
        }
      } finally {
        setPictureLoading(false)
      }
    })()
  }

  if (user === null) {
    return null
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px' }}>My Profile</h1>

      {/* Profile Information Section */}
      <div
        style={{
          backgroundColor: '#f8f9fa',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '30px',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Profile Information</h2>

        {/* Profile Picture Section */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
            Profile Picture
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '15px',
            }}
          >
            {/* Current Profile Picture */}
            {user.profilePictureUrl !== undefined ? (
              <img
                src={`${API_URL}${user.profilePictureUrl}`}
                alt={user.username}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #007bff',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: '#6c757d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  border: '3px solid #6c757d',
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Preview of new picture */}
            {previewUrl !== null && (
              <div>
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: '#666',
                    marginBottom: '5px',
                  }}
                >
                  New Picture:
                </div>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #28a745',
                  }}
                />
              </div>
            )}
          </div>

          {/* File Input */}
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '5px',
              marginBottom: '10px',
            }}
          />
          <div
            style={{
              fontSize: '0.875rem',
              color: '#666',
              marginBottom: '15px',
            }}
          >
            JPEG or PNG, max 5MB
          </div>

          {pictureError !== null && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '5px',
                marginBottom: '15px',
              }}
            >
              {pictureError}
            </div>
          )}

          {pictureSuccess !== null && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#d4edda',
                color: '#155724',
                borderRadius: '5px',
                marginBottom: '15px',
              }}
            >
              {pictureSuccess}
            </div>
          )}

          <button
            onClick={handleProfilePictureUpload}
            disabled={pictureLoading || profilePicture === null}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              backgroundColor:
                pictureLoading || profilePicture === null ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor:
                pictureLoading || profilePicture === null
                  ? 'not-allowed'
                  : 'pointer',
              fontWeight: 'bold',
            }}
          >
            {pictureLoading ? 'Uploading...' : 'Upload Profile Picture'}
          </button>
        </div>

        <hr
          style={{
            margin: '30px 0',
            border: 'none',
            borderTop: '1px solid #dee2e6',
          }}
        />

        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="username"
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
            }}
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setProfileError(null)
              setProfileSuccess(null)
            }}
            placeholder="Enter username"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '5px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
            }}
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setProfileError(null)
              setProfileSuccess(null)
            }}
            placeholder="Enter email"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '5px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            Account Status
          </div>
          <div>
            {user.isVerified ? (
              <span style={{ color: '#28a745', fontWeight: '600' }}>
                ✓ Verified
              </span>
            ) : (
              <span style={{ color: '#ffc107', fontWeight: '600' }}>
                ⚠ Not Verified
              </span>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            Member Since
          </div>
          <div>
            {new Date(user.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {profileError !== null && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '5px',
              marginBottom: '15px',
            }}
          >
            {profileError}
          </div>
        )}

        {profileSuccess !== null && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '5px',
              marginBottom: '15px',
            }}
          >
            {profileSuccess}
          </div>
        )}

        <button
          onClick={handleProfileUpdate}
          disabled={profileLoading}
          style={{
            padding: '12px 30px',
            fontSize: '1rem',
            backgroundColor: profileLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: profileLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {profileLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Change Password Section */}
      <div
        style={{
          backgroundColor: '#f8f9fa',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '30px',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Change Password</h2>

        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="currentPassword"
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
            }}
          >
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value)
              setPasswordError(null)
              setPasswordSuccess(null)
            }}
            placeholder="Enter current password"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '5px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="newPassword"
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
            }}
          >
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              setPasswordError(null)
              setPasswordSuccess(null)
            }}
            placeholder="Enter new password"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '5px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="confirmPassword"
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
            }}
          >
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setPasswordError(null)
              setPasswordSuccess(null)
            }}
            placeholder="Confirm new password"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '5px',
            }}
          />
        </div>

        {passwordError !== null && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '5px',
              marginBottom: '15px',
            }}
          >
            {passwordError}
          </div>
        )}

        {passwordSuccess !== null && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '5px',
              marginBottom: '15px',
            }}
          >
            {passwordSuccess}
          </div>
        )}

        <button
          onClick={handlePasswordUpdate}
          disabled={
            passwordLoading ||
            currentPassword === '' ||
            newPassword === '' ||
            confirmPassword === ''
          }
          style={{
            padding: '12px 30px',
            fontSize: '1rem',
            backgroundColor:
              passwordLoading ||
              currentPassword === '' ||
              newPassword === '' ||
              confirmPassword === ''
                ? '#ccc'
                : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor:
              passwordLoading ||
              currentPassword === '' ||
              newPassword === '' ||
              confirmPassword === ''
                ? 'not-allowed'
                : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {passwordLoading ? 'Updating...' : 'Update Password'}
        </button>
      </div>

      {/* Delete Account Section */}
      <div
        style={{
          padding: '30px',
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

export default ProfilePage
