import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { clubApi } from '../api/clubApi'
import { movieApi } from '../api/movieApi'
import InlineAlert from '../components/InlineAlert'
import RotationOrderList from '../components/RotationOrderList'
import { useClubs } from '../contexts/ClubContext'
import type { Club, ClubFormData } from '../types/club'
import type { ClubRotationMember } from '../types/movie'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function ClubSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { refreshClubs } = useClubs()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [alert, setAlert] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null)

  // Movie settings
  const [rotation, setRotation] = useState<ClubRotationMember[]>([])

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

        // Check if user is admin
        if (data.role !== 'ADMIN') {
          setError('Only admins can access club settings')
          setLoading(false)
          return
        }

        // Populate form with current data
        setName(data.name)
        setDescription(data.description ?? '')
        setIsPublic(data.isPublic)
        if (data.profilePictureUrl !== null) {
          setProfilePicturePreview(`${API_URL}${data.profilePictureUrl}`)
        }

        // Fetch rotation
        const rotationData = await movieApi.getRotation(id)
        setRotation(rotationData)
      } catch (err) {
        console.error('Error fetching club:', err)
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load club details'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const handleProfilePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file !== undefined) {
      setProfilePicture(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    if (id === undefined) return

    setSaveLoading(true)
    setAlert(null)

    void (async () => {
      try {
        const formData: ClubFormData = {
          name: name.trim(),
          description: description.trim(),
          isPublic,
          profilePicture,
        }

        const updatedClub = await clubApi.updateClub(id, formData)
        setClub(updatedClub)
        // Refresh clubs list to show updated information
        await refreshClubs()
        setAlert({
          type: 'success',
          message: 'Club settings updated successfully!',
        })
        // Navigate after a short delay to show success message
        setTimeout(() => {
          void navigate(`/clubs/${id}`)
        }, 1500)
      } catch (err) {
        if (err instanceof Error && 'response' in err) {
          const axiosError = err as {
            response?: { data?: { error?: string } }
          }
          setAlert({
            type: 'error',
            message:
              axiosError.response?.data?.error ??
              'Failed to update club settings',
          })
        } else {
          setAlert({
            type: 'error',
            message: 'Failed to update club settings',
          })
        }
      } finally {
        setSaveLoading(false)
      }
    })()
  }

  const handleUpdateRotation = async (userIds: string[]) => {
    if (!id) return
    try {
      await movieApi.updateRotation(id, userIds)
      const rotationData = await movieApi.getRotation(id)
      setRotation(rotationData)
      setAlert({
        type: 'success',
        message: 'Rotation order updated successfully!',
      })
    } catch (err) {
      console.error('Error updating rotation:', err)
      setAlert({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to update rotation',
      })
    }
  }

  const handleRandomizeRotation = async () => {
    if (!id) return
    try {
      await movieApi.randomizeRotation(id)
      const rotationData = await movieApi.getRotation(id)
      setRotation(rotationData)
      setAlert({
        type: 'success',
        message: 'Rotation randomized successfully!',
      })
    } catch (err) {
      console.error('Error randomizing rotation:', err)
      setAlert({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to randomize rotation',
      })
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontSize: '1.1rem', color: '#666' }}>
          Loading settings...
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
            if (club !== null) {
              void navigate(`/clubs/${club.id}`)
            } else {
              void navigate('/dashboard')
            }
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
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
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

      {/* Page Title */}
      <h1 style={{ marginBottom: '30px' }}>Club Settings</h1>

      {/* Settings Form */}
      <div
        style={{
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '30px',
          backgroundColor: '#fff',
        }}
      >
        {/* Club Name */}
        <div style={{ marginBottom: '25px' }}>
          <label
            htmlFor="clubName"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            Club Name *
          </label>
          <input
            type="text"
            id="clubName"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setAlert(null)
            }}
            placeholder="Enter club name"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '5px',
            }}
          />
          <small style={{ color: '#666', fontSize: '0.875rem' }}>
            3-50 characters
          </small>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '25px' }}>
          <label
            htmlFor="clubDescription"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            Description
          </label>
          <textarea
            id="clubDescription"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setAlert(null)
            }}
            placeholder="Enter club description"
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '5px',
              resize: 'vertical',
            }}
          />
          <small style={{ color: '#666', fontSize: '0.875rem' }}>
            Up to 500 characters
          </small>
        </div>

        {/* Profile Picture */}
        <div style={{ marginBottom: '25px' }}>
          <label
            htmlFor="profilePicture"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            Profile Picture
          </label>

          {profilePicturePreview !== null && (
            <div
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#e9ecef',
                marginBottom: '15px',
              }}
            >
              <img
                src={profilePicturePreview}
                alt="Profile preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          )}

          <input
            type="file"
            id="profilePicture"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleProfilePictureChange}
            style={{
              display: 'block',
              fontSize: '1rem',
            }}
          />
          <small style={{ color: '#666', fontSize: '0.875rem' }}>
            JPEG or PNG, max 5MB
          </small>
        </div>

        {/* Privacy Setting */}
        <div style={{ marginBottom: '25px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => {
                setIsPublic(e.target.checked)
                setAlert(null)
              }}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>
              Make this club public
            </span>
          </label>
          <small
            style={{
              color: '#666',
              fontSize: '0.875rem',
              display: 'block',
              marginTop: '5px',
              marginLeft: '30px',
            }}
          >
            Public clubs can be discovered by other users
          </small>
        </div>

        {/* Movie Rotation Section */}
        <div
          style={{
            marginBottom: '25px',
            paddingTop: '25px',
            borderTop: '1px solid #dee2e6',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>
            Movie Suggester Rotation
          </h3>
          {rotation.length > 0 ? (
            <RotationOrderList
              rotation={rotation}
              editable
              onUpdate={(userIds) => {
                void handleUpdateRotation(userIds)
              }}
              onRandomize={() => {
                void handleRandomizeRotation()
              }}
            />
          ) : (
            <p style={{ color: '#666' }}>Loading rotation...</p>
          )}
        </div>

        {/* Alert Message */}
        {alert !== null && (
          <InlineAlert
            type={alert.type}
            message={alert.message}
            onDismiss={() => {
              setAlert(null)
            }}
          />
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '15px',
            paddingTop: '20px',
            borderTop: '1px solid #dee2e6',
          }}
        >
          <button
            onClick={handleSave}
            disabled={saveLoading || name.trim().length < 3}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              backgroundColor:
                saveLoading || name.trim().length < 3 ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor:
                saveLoading || name.trim().length < 3
                  ? 'not-allowed'
                  : 'pointer',
              fontWeight: 'bold',
            }}
          >
            {saveLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => {
              void navigate(`/clubs/${club.id}`)
            }}
            disabled={saveLoading}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: saveLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClubSettingsPage
