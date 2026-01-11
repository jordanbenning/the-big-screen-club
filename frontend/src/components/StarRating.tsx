import { useState } from 'react'

interface StarRatingProps {
  value?: number
  onChange?: (_rating: number) => void
  readonly?: boolean
  size?: 'small' | 'medium' | 'large'
}

const StarRating = ({
  value = 0,
  onChange,
  readonly = false,
  size = 'medium',
}: StarRatingProps) => {
  const [hover, setHover] = useState(0)

  const sizeMap = {
    small: '1.5rem',
    medium: '2rem',
    large: '2.5rem',
  }

  const starSize = sizeMap[size]

  // Generate array of 10 half-stars (0.5, 1.0, 1.5, ..., 5.0)
  const halfStars = Array.from({ length: 10 }, (_, i) => (i + 1) * 0.5)

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating)
    }
  }

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHover(rating)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHover(0)
    }
  }

  const displayValue = hover || value

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {halfStars.map((rating) => {
        const isHalfStar = rating % 1 !== 0
        const isFilled = displayValue >= rating

        return (
          <span
            key={rating}
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            style={{
              cursor: readonly ? 'default' : 'pointer',
              fontSize: starSize,
              color: isFilled ? '#ffc107' : '#e0e0e0',
              userSelect: 'none',
              position: 'relative',
            }}
          >
            {isHalfStar ? '⯨' : '★'}
          </span>
        )
      })}
      {!readonly && (
        <span style={{ marginLeft: '10px', fontSize: '1rem', color: '#666' }}>
          {displayValue.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export default StarRating
