import { useState } from 'react'

import type { MovieSuggestion, VoteRankings } from '../types/movie'

interface RankingVoteFormProps {
  suggestions: MovieSuggestion[]
  onSubmit: (rankings: VoteRankings) => void
  disabled?: boolean
}

const RankingVoteForm = ({
  suggestions,
  onSubmit,
  disabled = false,
}: RankingVoteFormProps) => {
  const [rankedMovies, setRankedMovies] = useState<MovieSuggestion[]>([
    ...suggestions,
  ])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newMovies = [...rankedMovies]
    const draggedMovie = newMovies[draggedIndex]
    newMovies.splice(draggedIndex, 1)
    newMovies.splice(index, 0, draggedMovie)

    setRankedMovies(newMovies)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSubmit = () => {
    const rankings: VoteRankings = {}
    rankedMovies.forEach((movie, index) => {
      rankings[movie.id] = index + 1
    })
    onSubmit(rankings)
  }

  return (
    <div style={{ width: '100%' }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px' }}>
        Rank the Movies (Drag to Reorder)
      </h3>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Drag movies to rank them from best (#1) to worst (#{suggestions.length}).
        Your #1 choice will receive 1 point, #2 will receive 2 points, etc. The
        movie with the lowest total points wins!
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        {rankedMovies.map((movie, index) => (
          <div
            key={movie.id}
            draggable={!disabled}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '15px',
              border: '2px solid #007bff',
              borderRadius: '8px',
              backgroundColor: draggedIndex === index ? '#e3f2fd' : 'white',
              cursor: disabled ? 'default' : 'grab',
              opacity: draggedIndex === index ? 0.5 : 1,
            }}
          >
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#007bff',
                minWidth: '40px',
                textAlign: 'center',
              }}
            >
              #{index + 1}
            </div>

            {movie.posterPath && (
              <img
                src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                alt={movie.title}
                style={{
                  width: '60px',
                  height: '90px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                }}
              />
            )}

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                {movie.title}{' '}
                {movie.releaseYear && `(${movie.releaseYear})`}
              </div>
              {movie.overview && (
                <div
                  style={{
                    color: '#666',
                    fontSize: '0.9rem',
                    marginTop: '5px',
                  }}
                >
                  {movie.overview.substring(0, 150)}
                  {movie.overview.length > 150 ? '...' : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled}
        style={{
          padding: '12px 24px',
          fontSize: '1rem',
          backgroundColor: disabled ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          width: '100%',
        }}
      >
        Submit Rankings
      </button>
    </div>
  )
}

export default RankingVoteForm

