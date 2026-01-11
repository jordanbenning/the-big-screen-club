import { useState, useEffect } from 'react'

import { movieApi } from '../api/movieApi'
import type { MovieSearchResult } from '../types/movie'

interface MovieSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (_movies: MovieSearchResult[]) => void
  maxSelections: number
  selectedMovies: MovieSearchResult[]
}

const MovieSearchModal = ({
  isOpen,
  onClose,
  onSelect,
  maxSelections,
  selectedMovies,
}: MovieSearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MovieSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSearchResults([])
      setError(null)
    }
  }, [isOpen])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    setError(null)

    try {
      const results = await movieApi.searchMovies(searchQuery)
      setSearchResults(results)
    } catch (err) {
      console.error('Error searching movies:', err)
      setError(err instanceof Error ? err.message : 'Failed to search movies')
    } finally {
      setSearching(false)
    }
  }

  const handleAddMovie = (movie: MovieSearchResult) => {
    if (selectedMovies.length >= maxSelections) {
      setError(`You can only select ${maxSelections} movies`)
      return
    }

    if (selectedMovies.some((m) => m.tmdbId === movie.tmdbId)) {
      setError('This movie is already selected')
      return
    }

    onSelect([...selectedMovies, movie])
    setSearchQuery('')
    setSearchResults([])
    setError(null)
  }

  const handleRemoveMovie = (tmdbId: number) => {
    onSelect(selectedMovies.filter((m) => m.tmdbId !== tmdbId))
  }

  const handleSubmit = () => {
    if (selectedMovies.length === maxSelections) {
      onClose()
    } else {
      setError(`Please select exactly ${maxSelections} movies`)
    }
  }

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
        overflow: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Select Movies</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Select {maxSelections} movies for the voting round (
          {selectedMovies.length}/{maxSelections} selected)
        </p>

        {/* Search Section */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleSearch()
                }
              }}
              placeholder="Search for a movie..."
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '1rem',
                border: '1px solid #ccc',
                borderRadius: '5px',
              }}
            />
            <button
              onClick={() => {
                void handleSearch()
              }}
              disabled={searching || !searchQuery.trim()}
              style={{
                padding: '10px 20px',
                fontSize: '1rem',
                backgroundColor: searching ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: searching ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '10px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '5px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        {/* Selected Movies */}
        {selectedMovies.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>
              Selected Movies
            </h3>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {selectedMovies.map((movie) => (
                <div
                  key={movie.tmdbId}
                  style={{
                    display: 'flex',
                    gap: '15px',
                    padding: '10px',
                    border: '2px solid #007bff',
                    borderRadius: '5px',
                    backgroundColor: '#f0f8ff',
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
                    <div style={{ fontWeight: 'bold' }}>
                      {movie.title}{' '}
                      {movie.releaseYear && `(${movie.releaseYear})`}
                    </div>
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
                  </div>
                  <button
                    onClick={() => handleRemoveMovie(movie.tmdbId)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      alignSelf: 'flex-start',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>
              Search Results
            </h3>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {searchResults.map((movie) => (
                <div
                  key={movie.tmdbId}
                  style={{
                    display: 'flex',
                    gap: '15px',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
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
                    <div style={{ fontWeight: 'bold' }}>
                      {movie.title}{' '}
                      {movie.releaseYear && `(${movie.releaseYear})`}
                    </div>
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
                  </div>
                  <button
                    onClick={() => handleAddMovie(movie)}
                    disabled={selectedMovies.length >= maxSelections}
                    style={{
                      padding: '5px 10px',
                      backgroundColor:
                        selectedMovies.length >= maxSelections
                          ? '#ccc'
                          : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor:
                        selectedMovies.length >= maxSelections
                          ? 'not-allowed'
                          : 'pointer',
                      alignSelf: 'flex-start',
                    }}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
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
            onClick={handleSubmit}
            disabled={selectedMovies.length !== maxSelections}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              backgroundColor:
                selectedMovies.length === maxSelections ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor:
                selectedMovies.length === maxSelections
                  ? 'pointer'
                  : 'not-allowed',
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

export default MovieSearchModal
