import express, { type Request, type Response } from 'express'

import { requireAuth } from '../middleware/authMiddleware'
import { authService } from '../services/authService'

const router = express.Router()

/**
 * GET /api/users/search?username={query}
 * Search for a user by exact username match
 */
router.get('/search', requireAuth, (req: Request, res: Response) => {
  void (async () => {
    try {
      const { username } = req.query

      if (typeof username !== 'string' || username.trim().length < 3) {
        res
          .status(400)
          .json({ error: 'Username query must be at least 3 characters' })
        return
      }

      const user = await authService.searchUserByUsername(username.trim())

      if (user === null) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      res.json(user)
    } catch (error) {
      console.error('Error searching for user:', error)
      res.status(500).json({ error: 'Failed to search for user' })
    }
  })()
})

export default router
