import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { movieApi } from '../api/movieApi'
import StarRating from '../components/StarRating'
import type { MovieHistory } from '../types/movie'

function MovieHistoryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [history, setHistory] = useState<MovieHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedMovie, setExpandedMovie] = useState<string | null>(null)
  const [ratingMovie, setRatingMovie] = useState<string | null>(null)
  const [newRating, setNewRating] = useState(0)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [alert, setAlert] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    if (!id) {
      setError('Invalid club ID')
      setLoading(false)
      return
    }

    void (async () => {
      try {
        const data = await movieApi.getMovieHistory(id)
        setHistory(data)
      } catch (err) {
        console.error('Error fetching movie history:', err)
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load movie history'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const handleSubmitRating = async (selectedMovieId: string) => {
    if (!id || newRating === 0) return
    setSubmitLoading(true)
    try {
      await movieApi.submitRating(selectedMovieId, newRating)
      // Refresh history
      const data = await movieApi.getMovieHistory(id)
      setHistory(data)
      setRatingMovie(null)
      setNewRating(0)
      setAlert({ type: 'success', message: 'Rating submitted successfully!' })
    } catch (err) {
      console.error('Error submitting rating:', err)
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to submit rating',
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontSize: '1.1rem', color: '#666' }}>
          Loading movie history...
        </p>
      </div>
    )
  }

  if (error !== null) {
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
          {error}
        </div>
        <button
          onClick={() => {
            if (id) {
              void navigate(`/clubs/${id}`)
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
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header with back button */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => {
            void navigate(`/clubs/${id}`)
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

      <h1 style={{ marginBottom: '30px' }}>Movie History</h1>

      {alert && (
        <div
          style={{
            padding: '15px',
            backgroundColor: alert.type === 'success' ? '#d4edda' : '#fee',
            color: alert.type === 'success' ? '#155724' : '#c33',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{alert.message}</span>
          <button
            onClick={() => setAlert(null)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '0 5px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {history.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
          }}
        >
          <p style={{ fontSize: '1.1rem', color: '#666', margin: 0 }}>
            No movies watched yet. Start a voting round to choose your first
            movie!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {history.map((movie) => (
            <div
              key={movie.id}
              style={{
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: 'white',
              }}
            >
              {/* Movie Header */}
              <div
                style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}
              >
                {movie.movie.posterPath && (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${movie.movie.posterPath}`}
                    alt={movie.movie.title}
                    style={{
                      width: '100px',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginTop: 0, marginBottom: '10px' }}>
                    {movie.movie.title}{' '}
                    {movie.movie.releaseYear && `(${movie.movie.releaseYear})`}
                  </h3>
                  <div style={{ color: '#666', fontSize: '0.95rem' }}>
                    <div style={{ marginBottom: '5px' }}>
                      <strong>Suggested by:</strong> {movie.suggestedBy}
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                      <strong>Watched:</strong>{' '}
                      {movie.watchedAt
                        ? new Date(movie.watchedAt).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )
                        : 'Not yet watched'}
                    </div>
                    {movie.averageRating !== null && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <strong>Average Rating:</strong>
                        <StarRating
                          value={movie.averageRating}
                          readonly
                          size="small"
                        />
                        <span>({movie.averageRating.toFixed(1)})</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setExpandedMovie(
                        expandedMovie === movie.id ? null : movie.id
                      )
                    }
                    style={{
                      marginTop: '10px',
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    {expandedMovie === movie.id
                      ? 'Hide Details'
                      : 'Show Details'}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedMovie === movie.id && (
                <div
                  style={{
                    paddingTop: '15px',
                    borderTop: '1px solid #dee2e6',
                  }}
                >
                  {/* Voting Results */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginTop: 0 }}>Voting Results</h4>
                    <div
                      style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}
                    >
                      {movie.votes.map((vote, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '5px',
                            fontSize: '0.9rem',
                          }}
                        >
                          <strong>{vote.username}</strong>
                          <div style={{ marginTop: '5px' }}>
                            {Object.entries(vote.rankings)
                              .sort(
                                ([, a], [, b]) => (a as number) - (b as number)
                              )
                              .map(([, rank], i) => (
                                <div key={i}>#{rank}</div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Member Ratings */}
                  <div style={{ marginBottom: '15px' }}>
                    <h4 style={{ marginTop: 0 }}>Member Ratings</h4>
                    {movie.ratings.length > 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        {movie.ratings.map((rating, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '15px',
                              padding: '10px',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '5px',
                            }}
                          >
                            <strong style={{ minWidth: '150px' }}>
                              {rating.username}
                            </strong>
                            <StarRating
                              value={rating.rating}
                              readonly
                              size="small"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#666', margin: 0 }}>
                        No ratings yet. Be the first to rate this movie!
                      </p>
                    )}
                  </div>

                  {/* Add/Edit Rating */}
                  <div>
                    {ratingMovie === movie.id ? (
                      <div
                        style={{
                          padding: '15px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '5px',
                        }}
                      >
                        <h4 style={{ marginTop: 0 }}>Your Rating</h4>
                        <div style={{ marginBottom: '15px' }}>
                          <StarRating
                            value={newRating}
                            onChange={setNewRating}
                            size="medium"
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => {
                              void handleSubmitRating(movie.id)
                            }}
                            disabled={submitLoading || newRating === 0}
                            style={{
                              padding: '8px 16px',
                              backgroundColor:
                                submitLoading || newRating === 0
                                  ? '#ccc'
                                  : '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor:
                                submitLoading || newRating === 0
                                  ? 'not-allowed'
                                  : 'pointer',
                              fontWeight: 'bold',
                            }}
                          >
                            {submitLoading ? 'Submitting...' : 'Submit Rating'}
                          </button>
                          <button
                            onClick={() => {
                              setRatingMovie(null)
                              setNewRating(0)
                            }}
                            disabled={submitLoading}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: submitLoading ? 'not-allowed' : 'pointer',
                              fontWeight: 'bold',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setRatingMovie(movie.id)
                          // Pre-fill with existing rating if available
                          const existingRating = movie.ratings.find(() => true)
                          if (existingRating) {
                            setNewRating(existingRating.rating)
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        {movie.ratings.some(() => true)
                          ? 'Update Your Rating'
                          : 'Rate This Movie'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MovieHistoryPage
