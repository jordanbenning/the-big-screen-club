import { useEffect, useState } from 'react'

import { clubApi } from '../api/clubApi'
import type { Club, ClubFormData } from '../types/club'

import CreateClubModal from './CreateClubModal'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function ClubList() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchClubs = () => {
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const data = await clubApi.getUserClubs()
        setClubs(data)
      } catch (err) {
        console.error('Error fetching clubs:', err)
        setError('Failed to load clubs')
      } finally {
        setLoading(false)
      }
    })()
  }

  useEffect(() => {
    fetchClubs()
  }, [])

  const handleCreateClub = async (formData: ClubFormData) => {
    await clubApi.createClub(formData)
  }

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    fetchClubs()
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ fontSize: '1.1rem', color: '#666' }}>Loading clubs...</p>
      </div>
    )
  }

  if (error !== null) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#fee',
          color: '#c33',
          borderRadius: '8px',
        }}
      >
        {error}
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        <h2 style={{ margin: 0 }}>Your Movie Clubs</h2>
        {clubs.length > 0 && (
          <button
            onClick={() => {
              setShowCreateModal(true)
            }}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Create Club
          </button>
        )}
      </div>

      {clubs.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '2px dashed #dee2e6',
          }}
        >
          <h3 style={{ color: '#666', marginBottom: '10px' }}>No clubs yet</h3>
          <p style={{ color: '#999', marginBottom: '20px' }}>
            Create your first movie club to start watching and discussing films
            with friends!
          </p>
          <button
            onClick={() => {
              setShowCreateModal(true)
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
            Create Your First Club
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {clubs.map((club) => (
            <div
              key={club.id}
              role="button"
              tabIndex={0}
              style={{
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  // Future: Navigate to club page
                }
              }}
            >
              {/* Profile Picture */}
              <div
                style={{
                  width: '100%',
                  height: '150px',
                  marginBottom: '15px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#e9ecef',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                  <span style={{ fontSize: '3rem' }}>🎬</span>
                )}
              </div>

              {/* Club Name */}
              <h3
                style={{
                  margin: '0 0 10px 0',
                  fontSize: '1.25rem',
                  color: '#212529',
                }}
              >
                {club.name}
              </h3>

              {/* Description */}
              {club.description !== null && club.description !== '' && (
                <p
                  style={{
                    color: '#666',
                    fontSize: '0.9rem',
                    marginBottom: '15px',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {club.description}
                </p>
              )}

              {/* Club Info */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '1px solid #dee2e6',
                }}
              >
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  {club.memberCount}{' '}
                  {club.memberCount === 1 ? 'member' : 'members'}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                  }}
                >
                  {club.role === 'ADMIN' && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                      }}
                    >
                      ADMIN
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '0.75rem',
                      backgroundColor: club.isPublic ? '#28a745' : '#6c757d',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                    }}
                  >
                    {club.isPublic ? 'PUBLIC' : 'PRIVATE'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Club Modal */}
      {showCreateModal && (
        <CreateClubModal
          onClose={() => {
            setShowCreateModal(false)
          }}
          onSuccess={handleCreateSuccess}
          onSubmit={handleCreateClub}
        />
      )}
    </div>
  )
}

export default ClubList
