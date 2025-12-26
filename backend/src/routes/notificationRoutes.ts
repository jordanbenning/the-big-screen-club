import express, { type Request, type Response } from 'express'

import { requireAuth } from '../middleware/authMiddleware'
import { notificationService } from '../services/notificationService'

const router = express.Router()

/**
 * GET /api/notifications - Get all user notifications
 */
router.get('/', requireAuth, (req: Request, res: Response) => {
  void (async () => {
    try {
      const userId = req.session.userId

      if (userId === undefined) {
        res.status(401).json({ error: 'Not authenticated' })
        return
      }

      const notifications =
        await notificationService.getUserNotifications(userId)
      res.json(notifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      res.status(500).json({ error: 'Failed to fetch notifications' })
    }
  })()
})

/**
 * GET /api/notifications/unread-count - Get unread notification count
 */
router.get('/unread-count', requireAuth, (req: Request, res: Response) => {
  void (async () => {
    try {
      const userId = req.session.userId

      if (userId === undefined) {
        res.status(401).json({ error: 'Not authenticated' })
        return
      }

      const count = await notificationService.getUnreadCount(userId)
      res.json({ count })
    } catch (error) {
      console.error('Error fetching unread count:', error)
      res.status(500).json({ error: 'Failed to fetch unread count' })
    }
  })()
})

/**
 * PATCH /api/notifications/:id/read - Mark notification as read
 */
router.patch('/:id/read', requireAuth, (req: Request, res: Response) => {
  void (async () => {
    try {
      const userId = req.session.userId
      const { id } = req.params

      if (userId === undefined) {
        res.status(401).json({ error: 'Not authenticated' })
        return
      }

      await notificationService.markAsRead(id, userId)
      res.json({ message: 'Notification marked as read' })
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Notification not found' ||
          error.message === 'Not authorized to mark this notification as read'
        ) {
          res.status(404).json({ error: error.message })
          return
        }
      }
      console.error('Error marking notification as read:', error)
      res.status(500).json({ error: 'Failed to mark notification as read' })
    }
  })()
})

/**
 * PATCH /api/notifications/mark-all-read - Mark all notifications as read
 */
router.patch('/mark-all-read', requireAuth, (req: Request, res: Response) => {
  void (async () => {
    try {
      const userId = req.session.userId

      if (userId === undefined) {
        res.status(401).json({ error: 'Not authenticated' })
        return
      }

      await notificationService.markAllAsRead(userId)
      res.json({ message: 'All notifications marked as read' })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      res
        .status(500)
        .json({ error: 'Failed to mark all notifications as read' })
    }
  })()
})

export default router
