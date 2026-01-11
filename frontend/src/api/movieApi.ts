import type {
  ClubRotationMember,
  CurrentMovieState,
  MovieHistory,
  MovieSearchResult,
  VotingRound,
  VoteRankings,
} from '../types/movie'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const movieApi = {
  /**
   * Search for movies on TMDB
   */
  async searchMovies(query: string): Promise<MovieSearchResult[]> {
    const response = await fetch(
      `${API_URL}/api/movies/search?q=${encodeURIComponent(query)}`,
      {
        credentials: 'include',
      }
    )

    if (!response.ok) {
      const error = (await response.json()) as { error: string }
      throw new Error(error.error ?? 'Failed to search movies')
    }

    return (await response.json()) as MovieSearchResult[]
  },

  /**
   * Get rotation order for a club
   */
  async getRotation(clubId: string): Promise<ClubRotationMember[]> {
    const response = await fetch(`${API_URL}/api/clubs/${clubId}/rotation`, {
      credentials: 'include',
    })

    if (!response.ok) {
      const error = (await response.json()) as { error: string }
      throw new Error(error.error ?? 'Failed to get rotation')
    }

    return (await response.json()) as ClubRotationMember[]
  },

  /**
   * Update rotation order (admin only)
   */
  async updateRotation(clubId: string, userIds: string[]): Promise<void> {
    const response = await fetch(`${API_URL}/api/clubs/${clubId}/rotation`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userIds }),
    })

    if (!response.ok) {
      const error = (await response.json()) as { error: string }
      throw new Error(error.error ?? 'Failed to update rotation')
    }
  },

  /**
   * Randomize rotation order (admin only)
   */
  async randomizeRotation(clubId: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/clubs/${clubId}/rotation/randomize`,
      {
        method: 'POST',
        credentials: 'include',
      }
    )

    if (!response.ok) {
      const error = (await response.json()) as { error: string }
      throw new Error(error.error ?? 'Failed to randomize rotation')
    }
  },

  /**
   * Get current movie state for a club
   */
  async getCurrentMovieState(clubId: string): Promise<CurrentMovieState> {
    const response = await fetch(
      `${API_URL}/api/clubs/${clubId}/movies/current`,
      {
        credentials: 'include',
      }
    )

    if (!response.ok) {
      const error = (await response.json()) as { error: string }
      throw new Error(error.error ?? 'Failed to get current movie state')
    }

    return (await response.json()) as CurrentMovieState
  },

  /**
   * Start a new voting round
   */
  async startVotingRound(clubId: string): Promise<string> {
    const response = await fetch(
      `${API_URL}/api/clubs/${clubId}/movies/rounds`,
      {
        method: 'POST',
        credentials: 'include',
      }
    )

    if (!response.ok) {
      const error = (await response.json()) as { error: string }
      throw new Error(error.error ?? 'Failed to start voting round')
    }

    const data = (await response.json()) as { roundId: string }
    return data.roundId
  },

  /**
   * Add movie suggestions to a voting round
   */
  async addMovieSuggestions(
    roundId: string,
    movies: Array<{
      tmdbId: number
      title: string
      posterPath: string | null
      releaseYear: number | null
      overview: string | null
    }>
  ): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/movies/rounds/${roundId}/suggestions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ movies }),
      }
    )

    if (!response.ok) {
      const error = (await response.json()) as { error: string }
      throw new Error(error.error ?? 'Failed to add movie suggestions')
    }
  },

  /**
   * Submit a ranked vote for a voting round
   */
  async submitVote(roundId: string, rankings: VoteRankings): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/movies/rounds/${roundId}/votes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ rankings }),
      }
    )

    if (!response.ok) {
      const error = (await response.json()) as { error: string }
      throw new Error(error.error ?? 'Failed to submit vote')
    }
  },

  /**
   * Trigger reveal of voting results
   */
  async triggerReveal(roundId: string): Promise<{
    status: 'winner' | 'tie'
    winnerId?: string
    tiedMovieIds?: string[]
  }> {
    const response = await fetch(
      `${API_URL}/api/movies/rounds/${roundId}/reveal`,
      {
        method: 'POST',
        credentials: 'include',
      }
    )

    if (!response.ok) {
      const error = (await response.json()) as { error: string }
      throw new Error(error.error ?? 'Failed to trigger reveal')
    }

    return (await response.json()) as {
      status: 'winner' | 'tie'
      winnerId?: string
      tiedMovieIds?: string[]
    }
  },

  /**
   * Break a tie by selecting a movie
   */
  async breakTie(roundId: string, movieSuggestionId: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/movies/rounds/${roundId}/tie-break`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ movieSuggestionId }),
      }
    )

    if (!response.ok) {
      const error = (await response.json()) as { error: string }
      throw new Error(error.error ?? 'Failed to break tie')
    }
  },

  /**
   * Select the winning movie and set watch-by date
   */
  async selectMovie(roundId: string, watchByDate: Date): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/movies/rounds/${roundId}/select`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ watchByDate: watchByDate.toISOString() }),
      }
    )

    if (!response.ok) {
      const error = (await response.json()) as { error: string }
      throw new Error(error.error ?? 'Failed to select movie')
    }
  },

  /**
   * Mark a movie as watched
   */
  async markAsWatched(selectedMovieId: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/movies/selected/${selectedMovieId}/watched`,
      {
        method: 'PUT',
        credentials: 'include',
      }
    )

    if (!response.ok) {
      const error = (await response.json()) as { error: string }
      throw new Error(error.error ?? 'Failed to mark movie as watched')
    }
  },

  /**
   * Submit a rating for a movie
   */
  async submitRating(selectedMovieId: string, rating: number): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/movies/selected/${selectedMovieId}/ratings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ rating }),
      }
    )

    if (!response.ok) {
      const error = (await response.json()) as { error: string }
      throw new Error(error.error ?? 'Failed to submit rating')
    }
  },

  /**
   * Get movie history for a club
   */
  async getMovieHistory(clubId: string): Promise<MovieHistory[]> {
    const response = await fetch(
      `${API_URL}/api/clubs/${clubId}/movies/history`,
      {
        credentials: 'include',
      }
    )

    if (!response.ok) {
      const error = (await response.json()) as { error: string }
      throw new Error(error.error ?? 'Failed to get movie history')
    }

    return (await response.json()) as MovieHistory[]
  },

  /**
   * Get detailed info about a voting round
   */
  async getVotingRoundDetails(roundId: string): Promise<VotingRound> {
    const response = await fetch(`${API_URL}/api/movies/rounds/${roundId}`, {
      credentials: 'include',
    })

    if (!response.ok) {
      const error = (await response.json()) as { error: string }
      throw new Error(error.error ?? 'Failed to get voting round details')
    }

    return (await response.json()) as VotingRound
  },
}
