import { useState } from 'react'

interface StarRatingProps {
  value?: number
  onChange?: (_rating: number) => void
  readonly?: boolean
  size?: 'small' | 'medium' | 'large'
}

// SVG star path
const STAR_PATH =
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'

interface StarProps {
  fillPercent: number // 0, 50, or 100
  starIndex: number
}

const Star = ({ fillPercent, starIndex }: StarProps) => {
  // Use unique clipPath ID per star to avoid conflicts
  const clipId = `halfClip-${starIndex}`

  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="12" height="24" />
        </clipPath>
      </defs>
      {/* Empty star background (outline) */}
      <path d={STAR_PATH} fill="#e0e0e0" />
      {/* Filled portion */}
      {fillPercent > 0 && (
        <path
          d={STAR_PATH}
          fill="#ffc107"
          clipPath={fillPercent === 50 ? `url(#${clipId})` : undefined}
        />
      )}
    </svg>
  )
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
  const displayValue = hover || value

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

  // Calculate fill percentage for each star (0, 50, or 100)
  const getStarFillPercent = (starIndex: number): number => {
    const starValue = starIndex + 1
    if (displayValue >= starValue) {
      return 100
    } else if (displayValue >= starValue - 0.5) {
      return 50
    }
    return 0
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
      }}
    >
      {[0, 1, 2, 3, 4].map((starIndex) => {
        const fillPercent = getStarFillPercent(starIndex)

        return (
          <div
            key={starIndex}
            style={{
              position: 'relative',
              width: starSize,
              height: starSize,
              cursor: readonly ? 'default' : 'pointer',
            }}
            onMouseLeave={handleMouseLeave}
          >
            <Star fillPercent={fillPercent} starIndex={starIndex} />

            {/* Interactive click/hover zones for half-star precision */}
            {!readonly && (
              <>
                {/* Left half - for x.5 rating */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '50%',
                    height: '100%',
                  }}
                  onClick={() => handleClick(starIndex + 0.5)}
                  onMouseEnter={() => handleMouseEnter(starIndex + 0.5)}
                />
                {/* Right half - for whole rating */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '50%',
                    height: '100%',
                  }}
                  onClick={() => handleClick(starIndex + 1)}
                  onMouseEnter={() => handleMouseEnter(starIndex + 1)}
                />
              </>
            )}
          </div>
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
