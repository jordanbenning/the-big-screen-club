import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { clubApi } from '../api/clubApi'
import type { Club } from '../types/club'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function ClubPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveLoading, setLeaveLoading] = useState(false)

  useEffect(() => {
    if (id === undefined) {
      setError('Invalid club ID')
      setLoading(false)
      return
    }

    void (async () => {
      try {
        const data = await clubApi.getClubById(id)
        setClub(data)
      } catch (err) {
        console.error('Error fetching club:', err)
        setError('Failed to load club details')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const handleLeaveClub = () => {
    if (id === undefined) return

    setLeaveLoading(true)

    void (async () => {
      try {
        await clubApi.leaveClub(id)
        // Navigate back to dashboard after leaving
        void navigate('/dashboard')
      } catch (err) {
        console.error('Error leaving club:', err)
        // eslint-disable-next-line no-alert
        window.alert('Failed to leave club. Please try again.')
      } finally {
        setLeaveLoading(false)
        setShowLeaveModal(false)
      }
    })()
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontSize: '1.1rem', color: '#666' }}>
          Loading club...
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

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header with back button */}
      <div style={{ marginBottom: '30px' }}>
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

      {/* Club Header */}
      <div
        style={{
          backgroundColor: '#f8f9fa',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '30px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '30px',
            alignItems: 'start',
            flexWrap: 'wrap',
          }}
        >
          {/* Profile Picture */}
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#e9ecef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {club.profilePictureUrl !== null ? (
              <img
                src={`${API_URL}${club.profilePictureUrl}`}
                alt={club.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <span style={{ fontSize: '5rem' }}>🎬</span>
            )}
          </div>

          {/* Club Info */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '15px',
                flexWrap: 'wrap',
              }}
            >
              <h1 style={{ margin: 0 }}>{club.name}</h1>
              <span
                style={{
                  fontSize: '0.875rem',
                  backgroundColor: club.isPublic ? '#28a745' : '#6c757d',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                }}
              >
                {club.isPublic ? 'PUBLIC' : 'PRIVATE'}
              </span>
              {club.role === 'ADMIN' && (
                <span
                  style={{
                    fontSize: '0.875rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                  }}
                >
                  ADMIN
                </span>
              )}
            </div>

            {club.description !== null && club.description !== '' && (
              <p
                style={{
                  color: '#666',
                  fontSize: '1.1rem',
                  marginBottom: '20px',
                  lineHeight: '1.6',
                }}
              >
                {club.description}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: '#666',
                fontSize: '1rem',
              }}
            >
              <span style={{ fontWeight: 'bold' }}>Members:</span>
              <span>
                {club.memberCount}{' '}
                {club.memberCount === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '30px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => {
            void navigate(`/clubs/${club.id}/members`)
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
          View Members
        </button>

        {club.role === 'ADMIN' && (
          <button
            onClick={() => {
              void navigate(`/clubs/${club.id}/settings`)
            }}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Club Settings
          </button>
        )}

        <button
          onClick={() => {
            setShowLeaveModal(true)
          }}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Leave Club
        </button>
      </div>

      {/* Club Details Section */}
      <div
        style={{
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Club Details</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '150px 1fr',
            gap: '15px',
            fontSize: '1rem',
          }}
        >
          <div style={{ fontWeight: 'bold' }}>Created:</div>
          <div>
            {new Date(club.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          <div style={{ fontWeight: 'bold' }}>Last Updated:</div>
          <div>
            {new Date(club.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          <div style={{ fontWeight: 'bold' }}>Your Role:</div>
          <div>{club.role}</div>
        </div>
      </div>

      {/* Leave Club Modal */}
      {showLeaveModal && (
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
            <h2 style={{ marginTop: 0, color: '#c53030' }}>Leave Club?</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Are you sure you want to leave <strong>{club.name}</strong>?
              {club.memberCount === 1 && (
                <span
                  style={{
                    display: 'block',
                    marginTop: '10px',
                    color: '#c53030',
                  }}
                >
                  ⚠️ You are the last member. This club will be permanently
                  deleted.
                </span>
              )}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => {
                  setShowLeaveModal(false)
                }}
                disabled={leaveLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: '1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: leaveLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveClub}
                disabled={leaveLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: '1rem',
                  backgroundColor: leaveLoading ? '#ccc' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: leaveLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {leaveLoading ? 'Leaving...' : 'Leave Club'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClubPage
