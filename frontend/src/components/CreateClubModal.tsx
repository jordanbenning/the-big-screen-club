import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'

import type { ClubFormData } from '../types/club'

interface CreateClubModalProps {
  onClose: () => void
  onSuccess: () => void
  // eslint-disable-next-line no-unused-vars
  onSubmit: (data: ClubFormData) => Promise<void>
}

function CreateClubModal({
  onClose,
  onSuccess,
  onSubmit,
}: CreateClubModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null)
  const [descError, setDescError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileError(null)

    if (file === undefined) {
      setProfilePicture(null)
      setPreviewUrl(null)
      return
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setFileError('Only JPEG and PNG images are allowed')
      setProfilePicture(null)
      setPreviewUrl(null)
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size must be less than 5MB')
      setProfilePicture(null)
      setPreviewUrl(null)
      return
    }

    setProfilePicture(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const validateName = (value: string): boolean => {
    if (value.trim().length < 3) {
      setNameError('Club name must be at least 3 characters')
      return false
    }
    if (value.trim().length > 50) {
      setNameError('Club name must not exceed 50 characters')
      return false
    }
    setNameError(null)
    return true
  }

  const validateDescription = (value: string): boolean => {
    if (value.length > 500) {
      setDescError('Description must not exceed 500 characters')
      return false
    }
    setDescError(null)
    return true
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate all fields
    const isNameValid = validateName(name)
    const isDescValid = validateDescription(description)

    if (!isNameValid || !isDescValid || fileError !== null) {
      return
    }

    setLoading(true)

    void (async () => {
      try {
        await onSubmit({
          name: name.trim(),
          description: description.trim(),
          isPublic,
          profilePicture,
        })
        onSuccess()
      } catch (err) {
        if (err instanceof Error && 'response' in err) {
          const axiosError = err as {
            response?: { data?: { error?: string } }
          }
          setError(axiosError.response?.data?.error ?? 'Failed to create club')
        } else {
          setError('Failed to create club')
        }
      } finally {
        setLoading(false)
      }
    })()
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      role="dialog"
      aria-modal="true"
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
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        role="document"
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => {
          e.stopPropagation()
        }}
        onKeyDown={(e) => {
          e.stopPropagation()
        }}
      >
        <h2 style={{ marginTop: 0 }}>Create a Movie Club</h2>

        <form onSubmit={handleSubmit}>
          {/* Club Name */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="clubName"
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              Club Name <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              id="clubName"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (e.target.value.length > 0) {
                  validateName(e.target.value)
                }
              }}
              onBlur={() => {
                if (name.length > 0) {
                  validateName(name)
                }
              }}
              placeholder="Enter club name (3-50 characters)"
              required
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                border:
                  nameError !== null ? '1px solid #dc3545' : '1px solid #ccc',
                borderRadius: '5px',
              }}
            />
            {nameError !== null && (
              <div
                style={{
                  color: '#dc3545',
                  fontSize: '0.875rem',
                  marginTop: '5px',
                }}
              >
                {nameError}
              </div>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="clubDescription"
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              Description
            </label>
            <textarea
              id="clubDescription"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                validateDescription(e.target.value)
              }}
              placeholder="Describe your club (optional, max 500 characters)"
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                border:
                  descError !== null ? '1px solid #dc3545' : '1px solid #ccc',
                borderRadius: '5px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            <div
              style={{ fontSize: '0.875rem', color: '#666', marginTop: '5px' }}
            >
              {description.length}/500 characters
            </div>
            {descError !== null && (
              <div
                style={{
                  color: '#dc3545',
                  fontSize: '0.875rem',
                  marginTop: '5px',
                }}
              >
                {descError}
              </div>
            )}
          </div>

          {/* Profile Picture */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="clubProfilePicture"
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              Profile Picture
            </label>
            <input
              type="file"
              id="clubProfilePicture"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '1rem',
                border: '1px solid #ccc',
                borderRadius: '5px',
              }}
            />
            <div
              style={{ fontSize: '0.875rem', color: '#666', marginTop: '5px' }}
            >
              Optional. JPEG or PNG, max 5MB
            </div>
            {fileError !== null && (
              <div
                style={{
                  color: '#dc3545',
                  fontSize: '0.875rem',
                  marginTop: '5px',
                }}
              >
                {fileError}
              </div>
            )}
            {previewUrl !== null && (
              <div style={{ marginTop: '10px' }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                  }}
                />
              </div>
            )}
          </div>

          {/* Public/Private Toggle */}
          <div style={{ marginBottom: '20px' }}>
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
                }}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontWeight: 'bold' }}>Public Club</span>
            </label>
            <div
              style={{
                fontSize: '0.875rem',
                color: '#666',
                marginTop: '5px',
                marginLeft: '30px',
              }}
            >
              {isPublic
                ? 'Public clubs are visible to all users and require admin approval to join'
                : 'Private clubs are invite-only'}
            </div>
          </div>

          {/* Error Message */}
          {error !== null && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '5px',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                fontSize: '1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || name.trim().length < 3}
              style={{
                padding: '10px 20px',
                fontSize: '1rem',
                backgroundColor:
                  loading || name.trim().length < 3 ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor:
                  loading || name.trim().length < 3 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              {loading ? 'Creating...' : 'Create Club'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateClubModal
