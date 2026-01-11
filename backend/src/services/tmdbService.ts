const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

interface TMDBSearchResult {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  overview: string
}

interface TMDBMovieDetails {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  overview: string
  runtime: number
  genres: Array<{ id: number; name: string }>
}

export interface MovieSearchResult {
  tmdbId: number
  title: string
  posterPath: string | null
  releaseYear: number | null
  overview: string
}

export interface MovieDetails extends MovieSearchResult {
  runtime: number | null
  genres: string[]
}

export const tmdbService = {
  /**
   * Search for movies by title
   */
  async searchMovies(query: string): Promise<MovieSearchResult[]> {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured')
    }

    if (!query.trim()) {
      return []
    }

    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`

    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`)
      }

      const data = (await response.json()) as { results: TMDBSearchResult[] }

      return data.results.slice(0, 10).map((movie) => ({
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        releaseYear: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : null,
        overview: movie.overview,
      }))
    } catch (error) {
      console.error('Error searching TMDB:', error)
      throw new Error('Failed to search movies')
    }
  },

  /**
   * Get detailed information about a specific movie
   */
  async getMovieDetails(tmdbId: number): Promise<MovieDetails> {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured')
    }

    const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`

    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`)
      }

      const movie = (await response.json()) as TMDBMovieDetails

      return {
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        releaseYear: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : null,
        overview: movie.overview,
        runtime: movie.runtime || null,
        genres: movie.genres.map((g) => g.name),
      }
    } catch (error) {
      console.error('Error fetching TMDB movie details:', error)
      throw new Error('Failed to fetch movie details')
    }
  },

  /**
   * Get the full poster URL for a poster path
   */
  getPosterUrl(
    posterPath: string | null,
    size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
  ): string | null {
    if (!posterPath) return null
    return `https://image.tmdb.org/t/p/${size}${posterPath}`
  },
}

