import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { clubApi } from '../api/clubApi'
import { userApi } from '../api/userApi'
import InlineAlert from '../components/InlineAlert'
import { useAuth } from '../contexts/AuthContext'
import type { UserSearchResult } from '../types/auth'
import type { Club, ClubMember } from '../types/club'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function ClubMembersPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [club, setClub] = useState<Club | null>(null)
  const [members, setMembers] = useState<ClubMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [foundUser, setFoundUser] = useState<UserSearchResult | null>(null)
  const [userNotFound, setUserNotFound] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchAbortControllerRef = useRef<AbortController | null>(null)
  const [alert, setAlert] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const fetchData = () => {
    if (id === undefined) {
      setError('Invalid club ID')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const [clubData, membersData] = await Promise.all([
          clubApi.getClubById(id),
          clubApi.getClubMembers(id),
        ])
        setClub(clubData)
        setMembers(membersData)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load club members')
      } finally {
        setLoading(false)
      }
    })()
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Debounced user search effect
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current !== null) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Cancel any pending request
    if (searchAbortControllerRef.current !== null) {
      searchAbortControllerRef.current.abort()
    }

    // Reset states when input changes
    setFoundUser(null)
    setUserNotFound(false)

    // Don't search if less than 3 characters
    if (inviteUsername.trim().length < 3) {
      setSearching(false)
      return
    }

    // Set searching state
    setSearching(true)

    // Create new abort controller for this request
    const abortController = new AbortController()
    searchAbortControllerRef.current = abortController

    // Debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      void (async () => {
        try {
          const result = await userApi.searchUserByUsername(
            inviteUsername.trim()
          )
          // Only update state if this request wasn't aborted
          if (!abortController.signal.aborted) {
            setFoundUser(result)
            setUserNotFound(false)
            setSearching(false)
          }
        } catch {
          if (!abortController.signal.aborted) {
            setFoundUser(null)
            setUserNotFound(true)
            setSearching(false)
          }
        }
      })()
    }, 500) // 500ms debounce

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current !== null) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (searchAbortControllerRef.current !== null) {
        searchAbortControllerRef.current.abort()
      }
    }
  }, [inviteUsername])

  const handleInviteMember = () => {
    if (id === undefined || foundUser === null) return

    setInviteLoading(true)
    setInviteError(null)

    void (async () => {
      try {
        await clubApi.inviteMember(id, foundUser.username)
        setShowInviteModal(false)
        setInviteUsername('')
        setFoundUser(null)
        setUserNotFound(false)
        setAlert({
          type: 'success',
          message: 'Invitation sent successfully!',
        })
      } catch (err) {
        if (err instanceof Error && 'response' in err) {
          const axiosError = err as {
            response?: { data?: { error?: string } }
          }
          setInviteError(
            axiosError.response?.data?.error ?? 'Failed to invite member'
          )
        } else {
          setInviteError('Failed to invite member')
        }
      } finally {
        setInviteLoading(false)
      }
    })()
  }

  const handleRemoveMember = (memberId: string, username: string) => {
    if (id === undefined) return

    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Are you sure you want to remove ${username} from the club?`
    )
    if (!confirmed) return

    void (async () => {
      try {
        await clubApi.removeMember(id, memberId)
        fetchData() // Refresh the list
      } catch (err) {
        console.error('Error removing member:', err)
        setAlert({
          type: 'error',
          message: 'Failed to remove member. Please try again.',
        })
      }
    })()
  }

  const handleChangeRole = (
    memberId: string,
    username: string,
    currentRole: string
  ) => {
    if (id === undefined) return

    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN'
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(`Change ${username}'s role to ${newRole}?`)
    if (!confirmed) return

    void (async () => {
      try {
        await clubApi.changeMemberRole(id, memberId, newRole)
        fetchData() // Refresh the list
      } catch (err) {
        console.error('Error changing role:', err)
        setAlert({
          type: 'error',
          message: 'Failed to change member role. Please try again.',
        })
      }
    })()
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontSize: '1.1rem', color: '#666' }}>
          Loading members...
        </p>
      </div>
    )
  }

  if (error !== null || club === null) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          {error ?? 'Club not found'}
        </div>
        <button
          onClick={() => {
            void navigate('/dashboard')
          }}
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    )
  }

  const isAdmin = club.role === 'ADMIN'

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Add keyframe animation for spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Header with back button */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => {
            void navigate(`/clubs/${club.id}`)
          }}
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ← Back to Club
        </button>
      </div>

      {/* Alert for member actions */}
      {alert !== null && (
        <InlineAlert
          type={alert.type}
          message={alert.message}
          onDismiss={() => {
            setAlert(null)
          }}
        />
      )}

      {/* Page Title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 10px 0' }}>{club.name} - Members</h1>
          <p style={{ margin: 0, color: '#666' }}>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setShowInviteModal(true)
            }}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Invite Member
          </button>
        )}
      </div>

      {/* Members List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {members.map((member) => (
          <div
            key={member.id}
            style={{
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap',
            }}
          >
            {/* Member Info */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '5px',
                  flexWrap: 'wrap',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                  {member.username}
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    backgroundColor:
                      member.role === 'ADMIN' ? '#007bff' : '#6c757d',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                  }}
                >
                  {member.role}
                </span>
              </div>
              <p
                style={{
                  margin: '5px 0 0 0',
                  color: '#666',
                  fontSize: '0.9rem',
                }}
              >
                {member.email}
              </p>
              <p
                style={{
                  margin: '5px 0 0 0',
                  color: '#999',
                  fontSize: '0.85rem',
                }}
              >
                Joined{' '}
                {new Date(member.joinedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* Admin Actions */}
            {isAdmin && member.id !== user?.id && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    handleChangeRole(member.id, member.username, member.role)
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {member.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                </button>
                <button
                  onClick={() => {
                    handleRemoveMember(member.id, member.username)
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
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
            <h2 style={{ marginTop: 0 }}>Invite Member</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Enter the username of the person you want to invite to {club.name}
              .
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="inviteUsername"
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
                id="inviteUsername"
                value={inviteUsername}
                onChange={(e) => {
                  setInviteUsername(e.target.value)
                  setInviteError(null)
                }}
                placeholder="Enter username (min 3 characters)"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                }}
              />
            </div>

            {/* Searching indicator */}
            {searching && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#e7f3ff',
                  color: '#004085',
                  borderRadius: '5px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #004085',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Searching...
              </div>
            )}

            {/* User found display */}
            {foundUser !== null && !searching && (
              <div
                style={{
                  padding: '15px',
                  backgroundColor: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '5px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                  }}
                >
                  {/* Profile Picture */}
                  {foundUser.profilePictureUrl !== null ? (
                    <img
                      src={`${API_URL}${foundUser.profilePictureUrl}`}
                      alt={foundUser.username}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #28a745',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: '#6c757d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        border: '2px solid #28a745',
                      }}
                    >
                      {foundUser.username.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* User Info */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        color: '#155724',
                        marginBottom: '2px',
                      }}
                    >
                      {foundUser.username}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#155724' }}>
                      {foundUser.email}
                    </div>
                  </div>

                  {/* Check mark */}
                  <div
                    style={{
                      fontSize: '1.5rem',
                      color: '#28a745',
                    }}
                  >
                    ✓
                  </div>
                </div>
              </div>
            )}

            {/* User not found message */}
            {userNotFound &&
              !searching &&
              inviteUsername.trim().length >= 3 && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    borderRadius: '5px',
                    marginBottom: '20px',
                  }}
                >
                  User not found
                </div>
              )}

            {/* API Error message */}
            {inviteError !== null && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#fee',
                  color: '#c33',
                  borderRadius: '5px',
                  marginBottom: '20px',
                }}
              >
                {inviteError}
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
                  setShowInviteModal(false)
                  setInviteUsername('')
                  setInviteError(null)
                  setFoundUser(null)
                  setUserNotFound(false)
                  setSearching(false)
                }}
                disabled={inviteLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: '1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: inviteLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleInviteMember}
                disabled={inviteLoading || foundUser === null}
                style={{
                  padding: '10px 20px',
                  fontSize: '1rem',
                  backgroundColor:
                    inviteLoading || foundUser === null ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor:
                    inviteLoading || foundUser === null
                      ? 'not-allowed'
                      : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {inviteLoading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClubMembersPage
