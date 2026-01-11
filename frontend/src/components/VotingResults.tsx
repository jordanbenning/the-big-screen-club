import type { MovieSuggestion, MovieVote } from '../types/movie'

interface VotingResultsProps {
  suggestions: MovieSuggestion[]
  votes: MovieVote[]
  winnerId?: string
}

const VotingResults = ({ suggestions, votes, winnerId }: VotingResultsProps) => {
  // Calculate scores for each movie
  const scores: Record<string, number> = {}
  suggestions.forEach((s) => {
    scores[s.id] = 0
  })

  votes.forEach((vote) => {
    Object.entries(vote.rankings).forEach(([movieId, rank]) => {
      scores[movieId] = (scores[movieId] || 0) + rank
    })
  })

  // Sort by score (lowest first)
  const sortedSuggestions = [...suggestions].sort(
    (a, b) => scores[a.id] - scores[b.id]
  )

  return (
    <div style={{ width: '100%' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>
        🎬 Voting Results 🎬
      </h3>

      {/* Movie Rankings */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          marginBottom: '30px',
        }}
      >
        {sortedSuggestions.map((movie, index) => {
          const isWinner = winnerId === movie.id
          return (
            <div
              key={movie.id}
              style={{
                padding: '20px',
                border: isWinner ? '3px solid #28a745' : '2px solid #ddd',
                borderRadius: '8px',
                backgroundColor: isWinner ? '#d4edda' : 'white',
              }}
            >
              <div style={{ display: 'flex', gap: '15px', alignItems: 'start' }}>
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: isWinner ? '#28a745' : '#666',
                    minWidth: '50px',
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
                  <div
                    style={{
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      marginBottom: '5px',
                    }}
                  >
                    {movie.title}{' '}
                    {movie.releaseYear && `(${movie.releaseYear})`}
                    {isWinner && (
                      <span
                        style={{
                          marginLeft: '10px',
                          color: '#28a745',
                          fontSize: '1.5rem',
                        }}
                      >
                        🏆
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#666', fontSize: '1rem' }}>
                    Total Points: <strong>{scores[movie.id]}</strong> (lower is
                    better)
                  </div>
                </div>
              </div>

              {/* Individual Rankings */}
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  Individual Rankings:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {votes.map((vote) => (
                    <div
                      key={vote.id}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                      }}
                    >
                      <strong>{vote.username}:</strong> #
                      {vote.rankings[movie.id]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {winnerId && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#d4edda',
            border: '2px solid #28a745',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: 0, color: '#28a745' }}>
            🎉 Winner Selected! 🎉
          </h2>
          <p style={{ margin: '10px 0 0 0', fontSize: '1.1rem' }}>
            The admin will now set the watch-by date.
          </p>
        </div>
      )}
    </div>
  )
}

export default VotingResults

