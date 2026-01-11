import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { clubApi } from '../api/clubApi'
import { movieApi } from '../api/movieApi'
import InlineAlert from '../components/InlineAlert'
import MovieSearchModal from '../components/MovieSearchModal'
import RankingVoteForm from '../components/RankingVoteForm'
import TieBreakModal from '../components/TieBreakModal'
import VotingResults from '../components/VotingResults'
import { useClubs } from '../contexts/ClubContext'
import { useMovie } from '../contexts/MovieContext'
import type { Club } from '../types/club'
import type { MovieSearchResult, VoteRankings } from '../types/movie'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function ClubPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { refreshClubs } = useClubs()
  const { currentMovieState, refreshMovieState } = useMovie()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveLoading, setLeaveLoading] = useState(false)
  const [alert, setAlert] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Movie-related state
  const [showMovieSearchModal, setShowMovieSearchModal] = useState(false)
  const [selectedMovies, setSelectedMovies] = useState<MovieSearchResult[]>([])
  const [showTieBreakModal, setShowTieBreakModal] = useState(false)
  const [movieActionLoading, setMovieActionLoading] = useState(false)
  const [watchByDate, setWatchByDate] = useState('')

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
        await refreshMovieState(id)
      } catch (err) {
        console.error('Error fetching club:', err)
        setError('Failed to load club details')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, refreshMovieState])

  const handleLeaveClub = () => {
    if (id === undefined) return

    setLeaveLoading(true)

    void (async () => {
      try {
        await clubApi.leaveClub(id)
        // Refresh clubs list before navigating
        await refreshClubs()
        // Navigate back to dashboard after leaving
        void navigate('/dashboard')
      } catch (err) {
        console.error('Error leaving club:', err)
        setAlert({
          type: 'error',
          message: 'Failed to leave club. Please try again.',
        })
      } finally {
        setLeaveLoading(false)
        setShowLeaveModal(false)
      }
    })()
  }

  // Movie handlers
  const handleStartVotingRound = async () => {
    if (!id) return
    setMovieActionLoading(true)
    try {
      await movieApi.startVotingRound(id)
      // Open modal to select movies
      setShowMovieSearchModal(true)
      await refreshMovieState(id)
      setAlert({ type: 'success', message: 'Voting round started!' })
    } catch (err) {
      console.error('Error starting voting round:', err)
      setAlert({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to start voting round',
      })
    } finally {
      setMovieActionLoading(false)
    }
  }

  const handleSubmitMovieSuggestions = async () => {
    if (!id || !currentMovieState?.activeVotingRound) return
    setMovieActionLoading(true)
    try {
      await movieApi.addMovieSuggestions(
        currentMovieState.activeVotingRound.id,
        selectedMovies.map((m) => ({
          tmdbId: m.tmdbId,
          title: m.title,
          posterPath: m.posterPath,
          releaseYear: m.releaseYear,
          overview: m.overview,
        }))
      )
      await refreshMovieState(id)
      setSelectedMovies([])
      setAlert({ type: 'success', message: 'Movies submitted successfully!' })
    } catch (err) {
      console.error('Error submitting movies:', err)
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to submit movies',
      })
    } finally {
      setMovieActionLoading(false)
    }
  }

  const handleSubmitVote = async (rankings: VoteRankings) => {
    if (!id || !currentMovieState?.activeVotingRound) return
    setMovieActionLoading(true)
    try {
      await movieApi.submitVote(
        currentMovieState.activeVotingRound.id,
        rankings
      )
      await refreshMovieState(id)
      setAlert({ type: 'success', message: 'Vote submitted successfully!' })
    } catch (err) {
      console.error('Error submitting vote:', err)
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to submit vote',
      })
    } finally {
      setMovieActionLoading(false)
    }
  }

  const handleReveal = async () => {
    if (!id || !currentMovieState?.activeVotingRound) return
    setMovieActionLoading(true)
    try {
      const result = await movieApi.triggerReveal(
        currentMovieState.activeVotingRound.id
      )
      await refreshMovieState(id)
      if (result.status === 'tie') {
        setShowTieBreakModal(true)
      }
      setAlert({ type: 'success', message: 'Results revealed!' })
    } catch (err) {
      console.error('Error revealing results:', err)
      setAlert({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to reveal results',
      })
    } finally {
      setMovieActionLoading(false)
    }
  }

  const handleTieBreak = async (movieId: string) => {
    if (!id || !currentMovieState?.activeVotingRound) return
    setMovieActionLoading(true)
    try {
      await movieApi.breakTie(currentMovieState.activeVotingRound.id, movieId)
      await refreshMovieState(id)
      setShowTieBreakModal(false)
      setAlert({ type: 'success', message: 'Tie broken successfully!' })
    } catch (err) {
      console.error('Error breaking tie:', err)
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to break tie',
      })
    } finally {
      setMovieActionLoading(false)
    }
  }

  const handleSelectMovie = async () => {
    if (!id || !currentMovieState?.activeVotingRound || !watchByDate) return
    setMovieActionLoading(true)
    try {
      await movieApi.selectMovie(
        currentMovieState.activeVotingRound.id,
        new Date(watchByDate)
      )
      await refreshMovieState(id)
      setWatchByDate('')
      setAlert({
        type: 'success',
        message: 'Movie selected with watch-by date!',
      })
    } catch (err) {
      console.error('Error selecting movie:', err)
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to select movie',
      })
    } finally {
      setMovieActionLoading(false)
    }
  }

  const handleMarkAsWatched = async () => {
    if (!id || !currentMovieState?.currentMovie) return
    setMovieActionLoading(true)
    try {
      await movieApi.markAsWatched(currentMovieState.currentMovie.id)
      await refreshMovieState(id)
      setAlert({ type: 'success', message: 'Movie marked as watched!' })
    } catch (err) {
      console.error('Error marking as watched:', err)
      setAlert({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to mark as watched',
      })
    } finally {
      setMovieActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontSize: '1.1rem', color: '#666' }}>
          Loading club...
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
            void navigate('/dashboard')
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
          ← Back to Dashboard
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
            void navigate('/dashboard')
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
          ← Back to Dashboard
        </button>
      </div>

      {/* Alert for errors */}
      {alert !== null && (
        <InlineAlert
          type={alert.type}
          message={alert.message}
          onDismiss={() => {
            setAlert(null)
          }}
        />
      )}

      {/* Club Header */}
      <div
        style={{
          backgroundColor: '#f8f9fa',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '30px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '30px',
            alignItems: 'start',
            flexWrap: 'wrap',
          }}
        >
          {/* Profile Picture */}
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#e9ecef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
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
              <span style={{ fontSize: '5rem' }}>🎬</span>
            )}
          </div>

          {/* Club Info */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '15px',
                flexWrap: 'wrap',
              }}
            >
              <h1 style={{ margin: 0 }}>{club.name}</h1>
              <span
                style={{
                  fontSize: '0.875rem',
                  backgroundColor: club.isPublic ? '#28a745' : '#6c757d',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                }}
              >
                {club.isPublic ? 'PUBLIC' : 'PRIVATE'}
              </span>
              {club.role === 'ADMIN' && (
                <span
                  style={{
                    fontSize: '0.875rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                  }}
                >
                  ADMIN
                </span>
              )}
            </div>

            {club.description !== null && club.description !== '' && (
              <p
                style={{
                  color: '#666',
                  fontSize: '1.1rem',
                  marginBottom: '20px',
                  lineHeight: '1.6',
                }}
              >
                {club.description}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: '#666',
                fontSize: '1rem',
              }}
            >
              <span style={{ fontWeight: 'bold' }}>Members:</span>
              <span>
                {club.memberCount}{' '}
                {club.memberCount === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '30px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => {
            void navigate(`/clubs/${club.id}/members`)
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
          View Members
        </button>

        <button
          onClick={() => {
            void navigate(`/clubs/${club.id}/movies/history`)
          }}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Movie History
        </button>

        {club.role === 'ADMIN' && (
          <button
            onClick={() => {
              void navigate(`/clubs/${club.id}/settings`)
            }}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Club Settings
          </button>
        )}

        <button
          onClick={() => {
            setShowLeaveModal(true)
          }}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Leave Club
        </button>
      </div>

      {/* Movie Status Section */}
      <div
        style={{
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px',
          backgroundColor: '#f8f9fa',
        }}
      >
        <h3 style={{ marginTop: 0 }}>🎬 Movie Club Status</h3>

        {/* Current Movie to Watch */}
        {currentMovieState?.currentMovie && (
          <div style={{ marginBottom: '20px' }}>
            <h4>Current Movie to Watch</h4>
            <div
              style={{
                display: 'flex',
                gap: '20px',
                padding: '15px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '2px solid #007bff',
              }}
            >
              {currentMovieState.currentMovie.posterPath && (
                <img
                  src={`https://image.tmdb.org/t/p/w185${currentMovieState.currentMovie.posterPath}`}
                  alt={currentMovieState.currentMovie.title}
                  style={{
                    width: '100px',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.3rem' }}>
                  {currentMovieState.currentMovie.title}{' '}
                  {currentMovieState.currentMovie.releaseYear &&
                    `(${currentMovieState.currentMovie.releaseYear})`}
                </div>
                <div style={{ color: '#666', marginTop: '10px' }}>
                  <strong>Watch By:</strong>{' '}
                  {new Date(
                    currentMovieState.currentMovie.watchByDate
                  ).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                {club.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      void handleMarkAsWatched()
                    }}
                    disabled={movieActionLoading}
                    style={{
                      marginTop: '15px',
                      padding: '10px 20px',
                      backgroundColor: movieActionLoading ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: movieActionLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    {movieActionLoading ? 'Processing...' : 'Mark as Watched'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Active Voting Round */}
        {currentMovieState?.activeVotingRound && (
          <div style={{ marginBottom: '20px' }}>
            {/* SUGGESTING Status - waiting for suggester to add movies */}
            {currentMovieState.activeVotingRound.status === 'SUGGESTING' &&
              (currentMovieState.currentTurn?.isCurrentUser ? (
                <div>
                  <h4>Your Turn to Suggest Movies!</h4>
                  <p style={{ color: '#666' }}>
                    Select movies for the voting round.
                  </p>
                  <button
                    onClick={() => setShowMovieSearchModal(true)}
                    disabled={movieActionLoading}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: movieActionLoading ? '#ccc' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: movieActionLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    Select Movies
                  </button>
                </div>
              ) : (
                <div>
                  <h4>Waiting for Movie Suggestions</h4>
                  <p style={{ color: '#666' }}>
                    {currentMovieState.activeVotingRound.suggestedByUsername} is
                    selecting movies for this round.
                  </p>
                </div>
              ))}

            {/* VOTING Status */}
            {currentMovieState.activeVotingRound.status === 'VOTING' && (
              <>
                {currentMovieState.currentTurn?.isCurrentUser ? (
                  <div>
                    <h4>Waiting for Others to Vote</h4>
                    <p style={{ color: '#666' }}>
                      You suggested the movies. Others are now voting.
                    </p>
                    <div style={{ marginTop: '15px' }}>
                      <strong>Suggested Movies:</strong>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(auto-fill, minmax(150px, 1fr))',
                          gap: '15px',
                          marginTop: '10px',
                        }}
                      >
                        {currentMovieState.activeVotingRound.suggestions.map(
                          (s) => (
                            <div
                              key={s.id}
                              style={{
                                textAlign: 'center',
                                padding: '10px',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                              }}
                            >
                              {s.posterPath && (
                                <img
                                  src={`https://image.tmdb.org/t/p/w185${s.posterPath}`}
                                  alt={s.title}
                                  style={{
                                    width: '100%',
                                    borderRadius: '4px',
                                    marginBottom: '5px',
                                  }}
                                />
                              )}
                              <div
                                style={{
                                  fontSize: '0.9rem',
                                  fontWeight: 'bold',
                                }}
                              >
                                {s.title}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ) : currentMovieState.userHasVoted ? (
                  <div>
                    <h4>Vote Submitted!</h4>
                    <p style={{ color: '#666' }}>
                      Waiting for others to vote. The suggester will reveal the
                      results when everyone has voted.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4>Vote on Movies</h4>
                    <RankingVoteForm
                      suggestions={
                        currentMovieState.activeVotingRound.suggestions
                      }
                      onSubmit={(rankings) => {
                        void handleSubmitVote(rankings)
                      }}
                      disabled={movieActionLoading}
                    />
                  </div>
                )}

                {/* Reveal Button for Suggester or Admin */}
                {(currentMovieState.currentTurn?.isCurrentUser ||
                  club.role === 'ADMIN') && (
                  <button
                    onClick={() => {
                      void handleReveal()
                    }}
                    disabled={movieActionLoading}
                    style={{
                      marginTop: '15px',
                      padding: '12px 24px',
                      backgroundColor: movieActionLoading ? '#ccc' : '#ff9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: movieActionLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    {movieActionLoading ? 'Processing...' : 'Reveal Results'}
                  </button>
                )}
              </>
            )}

            {/* REVEALED or TIE_BREAKING Status */}
            {(currentMovieState.activeVotingRound.status === 'REVEALED' ||
              currentMovieState.activeVotingRound.status ===
                'TIE_BREAKING') && (
              <div>
                <VotingResults
                  suggestions={currentMovieState.activeVotingRound.suggestions}
                  votes={currentMovieState.activeVotingRound.votes}
                  winnerId={currentMovieState.activeVotingRound.winnerMovieId}
                />

                {/* Admin sets watch-by date */}
                {club.role === 'ADMIN' &&
                  currentMovieState.activeVotingRound.winnerMovieId && (
                    <div style={{ marginTop: '20px' }}>
                      <h4>Set Watch-By Date</h4>
                      <div
                        style={{
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'center',
                        }}
                      >
                        <input
                          type="date"
                          value={watchByDate}
                          onChange={(e) => setWatchByDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          style={{
                            padding: '10px',
                            fontSize: '1rem',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            flex: 1,
                          }}
                        />
                        <button
                          onClick={() => {
                            void handleSelectMovie()
                          }}
                          disabled={movieActionLoading || !watchByDate}
                          style={{
                            padding: '10px 20px',
                            backgroundColor:
                              movieActionLoading || !watchByDate
                                ? '#ccc'
                                : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor:
                              movieActionLoading || !watchByDate
                                ? 'not-allowed'
                                : 'pointer',
                            fontWeight: 'bold',
                          }}
                        >
                          {movieActionLoading ? 'Setting...' : 'Set Date'}
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* No Active Round - Show Start Button or Wait Message */}
        {!currentMovieState?.currentMovie &&
          !currentMovieState?.activeVotingRound && (
            <div>
              {currentMovieState?.currentTurn?.isCurrentUser ||
              club.role === 'ADMIN' ? (
                <>
                  <h4>Start a New Voting Round</h4>
                  <p style={{ color: '#666' }}>
                    {currentMovieState?.currentTurn?.isCurrentUser
                      ? "It's your turn to suggest movies!"
                      : 'As an admin, you can start a voting round.'}
                  </p>
                  <button
                    onClick={() => {
                      void handleStartVotingRound()
                    }}
                    disabled={movieActionLoading}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: movieActionLoading ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: movieActionLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    {movieActionLoading ? 'Starting...' : 'Start Voting Round'}
                  </button>
                </>
              ) : (
                <>
                  <h4>Waiting for Next Movie</h4>
                  <p style={{ color: '#666' }}>
                    {currentMovieState?.currentTurn
                      ? `Waiting for ${currentMovieState.currentTurn.username} to start the next voting round.`
                      : 'Waiting for an admin to choose the next movie or start a movie vote.'}
                  </p>
                </>
              )}
            </div>
          )}
      </div>

      {/* Club Details Section */}
      <div
        style={{
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Club Details</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '150px 1fr',
            gap: '15px',
            fontSize: '1rem',
          }}
        >
          <div style={{ fontWeight: 'bold' }}>Created:</div>
          <div>
            {new Date(club.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          <div style={{ fontWeight: 'bold' }}>Last Updated:</div>
          <div>
            {new Date(club.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          <div style={{ fontWeight: 'bold' }}>Your Role:</div>
          <div>{club.role}</div>
        </div>
      </div>

      {/* Movie Search Modal */}
      <MovieSearchModal
        isOpen={showMovieSearchModal}
        onClose={() => {
          setShowMovieSearchModal(false)
          if (
            selectedMovies.length ===
            (currentMovieState?.activeVotingRound?.suggestions.length || 4)
          ) {
            void handleSubmitMovieSuggestions()
          }
        }}
        onSelect={setSelectedMovies}
        maxSelections={4}
        selectedMovies={selectedMovies}
      />

      {/* Tie Break Modal */}
      {currentMovieState?.activeVotingRound && (
        <TieBreakModal
          isOpen={showTieBreakModal}
          tiedMovies={
            currentMovieState.activeVotingRound.tiedMovies &&
            currentMovieState.activeVotingRound.suggestions
              ? currentMovieState.activeVotingRound.suggestions.filter((s) => {
                  const tiedMovies =
                    currentMovieState.activeVotingRound?.tiedMovies
                  return tiedMovies !== undefined && tiedMovies.includes(s.id)
                })
              : []
          }
          onSelect={(movieId) => {
            void handleTieBreak(movieId)
          }}
          onClose={() => setShowTieBreakModal(false)}
        />
      )}

      {/* Leave Club Modal */}
      {showLeaveModal && (
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
              maxWidth: '500px',
              width: '90%',
            }}
          >
            <h2 style={{ marginTop: 0, color: '#c53030' }}>Leave Club?</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Are you sure you want to leave <strong>{club.name}</strong>?
              {club.memberCount === 1 && (
                <span
                  style={{
                    display: 'block',
                    marginTop: '10px',
                    color: '#c53030',
                  }}
                >
                  ⚠️ You are the last member. This club will be permanently
                  deleted.
                </span>
              )}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => {
                  setShowLeaveModal(false)
                }}
                disabled={leaveLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: '1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: leaveLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveClub}
                disabled={leaveLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: '1rem',
                  backgroundColor: leaveLoading ? '#ccc' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: leaveLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {leaveLoading ? 'Leaving...' : 'Leave Club'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClubPage
