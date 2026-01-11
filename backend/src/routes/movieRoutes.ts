import { Router, type Request, type Response } from 'express'

import { requireAuth } from '../middleware/authMiddleware'
import { movieService } from '../services/movieService'
import { tmdbService } from '../services/tmdbService'

const router = Router()

// All routes require authentication
router.use(requireAuth)

/**
 * GET /api/movies/search
 * Search for movies on TMDB
 */
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string

    if (!query) {
      res.status(400).json({ error: 'Query parameter is required' })
      return
    }

    const results = await tmdbService.searchMovies(query)
    res.json(results)
  } catch (error) {
    console.error('Error searching movies:', error)
    res.status(500).json({ error: 'Failed to search movies' })
  }
})

/**
 * POST /api/movies/rounds/:roundId/suggestions
 * Add movie suggestions to a voting round
 */
router.post(
  '/rounds/:roundId/suggestions',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roundId } = req.params
      const userId = req.session.userId!
      const { movies } = req.body as {
        movies: Array<{
          tmdbId: number
          title: string
          posterPath: string | null
          releaseYear: number | null
          overview: string | null
        }>
      }

      if (!Array.isArray(movies)) {
        res.status(400).json({ error: 'movies must be an array' })
        return
      }

      await movieService.addMovieSuggestions(roundId, userId, movies)
      res.json({ message: 'Movies suggested successfully' })
    } catch (error) {
      console.error('Error adding movie suggestions:', error)
      const message =
        error instanceof Error ? error.message : 'Failed to add movie suggestions'
      res.status(400).json({ error: message })
    }
  }
)

/**
 * POST /api/movies/rounds/:roundId/votes
 * Submit a ranked vote for a voting round
 */
router.post(
  '/rounds/:roundId/votes',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roundId } = req.params
      const userId = req.session.userId!
      const { rankings } = req.body as { rankings: Record<string, number> }

      if (typeof rankings !== 'object' || rankings === null) {
        res.status(400).json({ error: 'rankings must be an object' })
        return
      }

      await movieService.submitVote(roundId, userId, rankings)
      res.json({ message: 'Vote submitted successfully' })
    } catch (error) {
      console.error('Error submitting vote:', error)
      const message =
        error instanceof Error ? error.message : 'Failed to submit vote'
      res.status(400).json({ error: message })
    }
  }
)

/**
 * POST /api/movies/rounds/:roundId/reveal
 * Trigger reveal of voting results
 */
router.post(
  '/rounds/:roundId/reveal',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roundId } = req.params
      const userId = req.session.userId!

      const result = await movieService.triggerReveal(roundId, userId)
      res.json(result)
    } catch (error) {
      console.error('Error triggering reveal:', error)
      const message =
        error instanceof Error ? error.message : 'Failed to trigger reveal'
      res.status(400).json({ error: message })
    }
  }
)

/**
 * POST /api/movies/rounds/:roundId/tie-break
 * Break a tie by selecting a movie
 */
router.post(
  '/rounds/:roundId/tie-break',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roundId } = req.params
      const userId = req.session.userId!
      const { movieSuggestionId } = req.body as { movieSuggestionId: string }

      if (!movieSuggestionId) {
        res.status(400).json({ error: 'movieSuggestionId is required' })
        return
      }

      await movieService.breakTie(roundId, userId, movieSuggestionId)
      res.json({ message: 'Tie broken successfully' })
    } catch (error) {
      console.error('Error breaking tie:', error)
      const message =
        error instanceof Error ? error.message : 'Failed to break tie'
      res.status(400).json({ error: message })
    }
  }
)

/**
 * POST /api/movies/rounds/:roundId/select
 * Select the winning movie and set watch-by date
 */
router.post(
  '/rounds/:roundId/select',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roundId } = req.params
      const userId = req.session.userId!
      const { watchByDate } = req.body as { watchByDate: string }

      if (!watchByDate) {
        res.status(400).json({ error: 'watchByDate is required' })
        return
      }

      const date = new Date(watchByDate)
      if (isNaN(date.getTime())) {
        res.status(400).json({ error: 'Invalid date format' })
        return
      }

      await movieService.selectMovie(roundId, userId, date)
      res.json({ message: 'Movie selected successfully' })
    } catch (error) {
      console.error('Error selecting movie:', error)
      const message =
        error instanceof Error ? error.message : 'Failed to select movie'
      res.status(400).json({ error: message })
    }
  }
)

/**
 * PUT /api/movies/selected/:selectedId/watched
 * Mark a movie as watched
 */
router.put(
  '/selected/:selectedId/watched',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { selectedId } = req.params
      const userId = req.session.userId!

      await movieService.markAsWatched(selectedId, userId)
      res.json({ message: 'Movie marked as watched' })
    } catch (error) {
      console.error('Error marking movie as watched:', error)
      const message =
        error instanceof Error ? error.message : 'Failed to mark movie as watched'
      res.status(400).json({ error: message })
    }
  }
)

/**
 * POST /api/movies/selected/:selectedId/ratings
 * Submit a rating for a movie
 */
router.post(
  '/selected/:selectedId/ratings',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { selectedId } = req.params
      const userId = req.session.userId!
      const { rating } = req.body as { rating: number }

      if (typeof rating !== 'number') {
        res.status(400).json({ error: 'rating must be a number' })
        return
      }

      await movieService.submitRating(selectedId, userId, rating)
      res.json({ message: 'Rating submitted successfully' })
    } catch (error) {
      console.error('Error submitting rating:', error)
      const message =
        error instanceof Error ? error.message : 'Failed to submit rating'
      res.status(400).json({ error: message })
    }
  }
)

/**
 * GET /api/movies/rounds/:roundId
 * Get detailed info about a voting round
 */
router.get(
  '/rounds/:roundId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roundId } = req.params
      const userId = req.session.userId!

      const round = await movieService.getVotingRoundDetails(roundId, userId)
      res.json(round)
    } catch (error) {
      console.error('Error getting voting round details:', error)
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to get voting round details'
      res.status(400).json({ error: message })
    }
  }
)

export default router

