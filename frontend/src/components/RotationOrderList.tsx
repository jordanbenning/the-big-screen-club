import { useState } from 'react'

import type { ClubRotationMember } from '../types/movie'

interface RotationOrderListProps {
  rotation: ClubRotationMember[]
  editable?: boolean
  onUpdate?: (userIds: string[]) => void
  onRandomize?: () => void
}

const RotationOrderList = ({
  rotation,
  editable = false,
  onUpdate,
  onRandomize,
}: RotationOrderListProps) => {
  const [members, setMembers] = useState<ClubRotationMember[]>([...rotation])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const handleDragStart = (index: number) => {
    if (!editable) return
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!editable) return
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newMembers = [...members]
    const draggedMember = newMembers[draggedIndex]
    newMembers.splice(draggedIndex, 1)
    newMembers.splice(index, 0, draggedMember)

    setMembers(newMembers)
    setDraggedIndex(index)
    setHasChanges(true)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSave = () => {
    if (onUpdate && hasChanges) {
      const userIds = members.map((m) => m.userId)
      onUpdate(userIds)
      setHasChanges(false)
    }
  }

  const handleReset = () => {
    setMembers([...rotation])
    setHasChanges(false)
  }

  const handleRandomize = () => {
    if (onRandomize) {
      onRandomize()
      setHasChanges(false)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px',
        }}
      >
        <h3 style={{ margin: 0 }}>Movie Suggester Rotation</h3>
        {editable && onRandomize && (
          <button
            onClick={handleRandomize}
            style={{
              padding: '8px 16px',
              fontSize: '0.9rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            🎲 Randomize
          </button>
        )}
      </div>

      {editable && (
        <p style={{ color: '#666', marginBottom: '15px', fontSize: '0.9rem' }}>
          Drag members to reorder the rotation. The person at the top will be next
          to suggest movies.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {members.map((member, index) => (
          <div
            key={member.id}
            draggable={editable}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              backgroundColor: draggedIndex === index ? '#e3f2fd' : 'white',
              cursor: editable ? 'grab' : 'default',
              opacity: draggedIndex === index ? 0.5 : 1,
            }}
          >
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#007bff',
                minWidth: '30px',
                textAlign: 'center',
              }}
            >
              {index + 1}
            </div>
            <div style={{ flex: 1, fontWeight: '500' }}>{member.username}</div>
            {index === 0 && (
              <span
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                }}
              >
                Next Up
              </span>
            )}
          </div>
        ))}
      </div>

      {editable && hasChanges && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '15px',
          }}
        >
          <button
            onClick={handleReset}
            style={{
              flex: 1,
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
            Reset
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
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
            Save Changes
          </button>
        </div>
      )}
    </div>
  )
}

export default RotationOrderList

