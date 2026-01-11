import { useState } from 'react'

import type { MovieSuggestion } from '../types/movie'

interface TieBreakModalProps {
  isOpen: boolean
  tiedMovies: MovieSuggestion[]
  onSelect: (movieId: string) => void
  onClose: () => void
}

const TieBreakModal = ({
  isOpen,
  tiedMovies,
  onSelect,
  onClose,
}: TieBreakModalProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (!isOpen) return null

  return (
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
          maxWidth: '700px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <h2 style={{ marginTop: 0, color: '#ff9800' }}>
          🤝 It's a Tie! 🤝
        </h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          The voting resulted in a tie. As the suggester, you get to choose the
          winning movie from the tied options:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {tiedMovies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => setSelectedId(movie.id)}
              style={{
                display: 'flex',
                gap: '15px',
                padding: '15px',
                border:
                  selectedId === movie.id
                    ? '3px solid #007bff'
                    : '2px solid #ddd',
                borderRadius: '8px',
                backgroundColor: selectedId === movie.id ? '#e3f2fd' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
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
                    {movie.overview.substring(0, 200)}
                    {movie.overview.length > 200 ? '...' : ''}
                  </div>
                )}
              </div>
              {selectedId === movie.id && (
                <div
                  style={{
                    fontSize: '2rem',
                    alignSelf: 'center',
                  }}
                >
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            marginTop: '20px',
          }}
        >
          <button
            onClick={onClose}
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
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedId) {
                onSelect(selectedId)
              }
            }}
            disabled={!selectedId}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              backgroundColor: selectedId ? '#28a745' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: selectedId ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
            }}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  )
}

export default TieBreakModal

