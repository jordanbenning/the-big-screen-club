import path from 'path'

import express, { type Request, type Response } from 'express'
import type { FileFilterCallback } from 'multer'
import multer from 'multer'

import { requireAuth } from '../middleware/authMiddleware'
import { clubService } from '../services/clubService'
import { movieService } from '../services/movieService'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/club-profiles'))
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    cb(null, `club-${uniqueSuffix}${ext}`)
  },
})

const fileFilter = (
  _req: Request,
  // eslint-disable-next-line no-undef
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  // Accept only JPEG and PNG images
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG and PNG images are allowed'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

/**
 * POST /api/clubs - Create a new club
 */
router.post(
  '/',
  requireAuth,
  upload.single('profilePicture'),
  (req: Request, res: Response) => {
    void (async () => {
      try {
        const { name, description, isPublic } = req.body
        const userId = req.session.userId

        if (userId === undefined) {
          res.status(401).json({ error: 'Not authenticated' })
          return
        }

        // Validate name
        if (typeof name !== 'string' || name.trim().length < 3) {
          res
            .status(400)
            .json({ error: 'Club name must be at least 3 characters' })
          return
        }

        if (name.trim().length > 50) {
          res
            .status(400)
            .json({ error: 'Club name must not exceed 50 characters' })
          return
        }

        // Validate description if provided
        if (
          description !== undefined &&
          description !== null &&
          description !== ''
        ) {
          if (typeof description !== 'string') {
            res.status(400).json({ error: 'Description must be a string' })
            return
          }

          if (description.length > 500) {
            res
              .status(400)
              .json({ error: 'Description must not exceed 500 characters' })
            return
          }
        }

        // Get profile picture URL if uploaded
        let profilePictureUrl: string | undefined
        if (req.file !== undefined) {
          profilePictureUrl = `/uploads/club-profiles/${req.file.filename}`
        }

        // Create the club
        const club = await clubService.createClub({
          name: name.trim(),
          description:
            description !== undefined &&
            description !== null &&
            description !== ''
              ? description.trim()
              : undefined,
          profilePictureUrl,
          isPublic: isPublic === 'true' || isPublic === true,
          createdById: userId,
        })

        res.status(201).json(club)
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'A club with this name already exists') {
            res.status(409).json({ error: error.message })
            return
          }
          console.error('Error creating club:', error)
          res.status(500).json({ error: 'Failed to create club' })
        } else {
          console.error('Unknown error creating club:', error)
          res.status(500).json({ error: 'Failed to create club' })
        }
      }
    })()
  }
)

/**
 * GET /api/clubs - Get current user's clubs
 */
router.get('/', requireAuth, (req: Request, res: Response) => {
  void (async () => {
    try {
      const userId = req.session.userId

      if (userId === undefined) {
        res.status(401).json({ error: 'Not authenticated' })
        return
      }

      const clubs = await clubService.getUserClubs(userId)
      res.json(clubs)
    } catch (error) {
      console.error('Error fetching clubs:', error)
      res.status(500).json({ error: 'Failed to fetch clubs' })
    }
  })()
})

/**
 * GET /api/clubs/:id - Get specific club details
 */
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  void (async () => {
    try {
      const userId = req.session.userId
      const { id } = req.params

      if (userId === undefined) {
        res.status(401).json({ error: 'Not authenticated' })
        return
      }

      const club = await clubService.getClubById(id, userId)

      if (club === null) {
        res.status(404).json({ error: 'Club not found' })
        return
      }

      res.json(club)
    } catch (error) {
      console.error('Error fetching club:', error)
      res.status(500).json({ error: 'Failed to fetch club' })
    }
  })()
})

/**
 * GET /api/clubs/:id/members - Get club members
 */
router.get('/:id/members', requireAuth, (req: Request, res: Response) => {
  void (async () => {
    try {
      const userId = req.session.userId
      const { id } = req.params

      if (userId === undefined) {
        res.status(401).json({ error: 'Not authenticated' })
        return
      }

      const members = await clubService.getClubMembers(id, userId)
      res.json(members)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Not a member of this club') {
          res.status(403).json({ error: error.message })
          return
        }
      }
      console.error('Error fetching club members:', error)
      res.status(500).json({ error: 'Failed to fetch club members' })
    }
  })()
})

/**
 * POST /api/clubs/:id/leave - Leave a club
 */
router.post('/:id/leave', requireAuth, (req: Request, res: Response) => {
  void (async () => {
    try {
      const userId = req.session.userId
      const { id } = req.params

      if (userId === undefined) {
        res.status(401).json({ error: 'Not authenticated' })
        return
      }

      await clubService.leaveClub(id, userId)
      res.json({ message: 'Successfully left the club' })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Not a member of this club') {
          res.status(403).json({ error: error.message })
          return
        }
      }
      console.error('Error leaving club:', error)
      res.status(500).json({ error: 'Failed to leave club' })
    }
  })()
})

/**
 * POST /api/clubs/:id/invite - Invite a member to a club
 */
router.post('/:id/invite', requireAuth, (req: Request, res: Response) => {
  void (async () => {
    try {
      const userId = req.session.userId
      const { id } = req.params
      const { username } = req.body

      if (userId === undefined) {
        res.status(401).json({ error: 'Not authenticated' })
        return
      }

      if (typeof username !== 'string' || username.trim() === '') {
        res.status(400).json({ error: 'Username is required' })
        return
      }

      await clubService.inviteMember(id, userId, username.trim())
      res.json({ message: 'Invitation sent successfully' })
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Not a member of this club' ||
          error.message === 'Only admins can invite members' ||
          error.message === 'User not found' ||
          error.message === 'User is already a member of this club' ||
          error.message === 'Club has reached maximum member limit (12)' ||
          error.message === 'User already has a pending invitation'
        ) {
          res.status(400).json({ error: error.message })
          return
        }
      }
      console.error('Error inviting member:', error)
      res.status(500).json({ error: 'Failed to invite member' })
    }
  })()
})

/**
 * DELETE /api/clubs/:id/members/:userId - Remove a member from a club
 */
router.delete(
  '/:id/members/:userId',
  requireAuth,
  (req: Request, res: Response) => {
    void (async () => {
      try {
        const adminUserId = req.session.userId
        const { id, userId } = req.params

        if (adminUserId === undefined) {
          res.status(401).json({ error: 'Not authenticated' })
          return
        }

        await clubService.removeMember(id, adminUserId, userId)
        res.json({ message: 'Member removed successfully' })
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message === 'Not a member of this club' ||
            error.message === 'Only admins can remove members' ||
            error.message === 'Use leave club to remove yourself' ||
            error.message === 'User is not a member of this club'
          ) {
            res.status(400).json({ error: error.message })
            return
          }
        }
        console.error('Error removing member:', error)
        res.status(500).json({ error: 'Failed to remove member' })
      }
    })()
  }
)

/**
 * PATCH /api/clubs/:id/members/:userId/role - Change a member's role
 */
router.patch(
  '/:id/members/:userId/role',
  requireAuth,
  (req: Request, res: Response) => {
    void (async () => {
      try {
        const adminUserId = req.session.userId
        const { id, userId } = req.params
        const { role } = req.body

        if (adminUserId === undefined) {
          res.status(401).json({ error: 'Not authenticated' })
          return
        }

        if (role !== 'ADMIN' && role !== 'MEMBER') {
          res.status(400).json({ error: 'Invalid role' })
          return
        }

        await clubService.changeMemberRole(id, adminUserId, userId, role)
        res.json({ message: 'Member role updated successfully' })
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message === 'Not a member of this club' ||
            error.message === 'Only admins can change member roles' ||
            error.message === 'User is not a member of this club'
          ) {
            res.status(400).json({ error: error.message })
            return
          }
        }
        console.error('Error changing member role:', error)
        res.status(500).json({ error: 'Failed to change member role' })
      }
    })()
  }
)

/**
 * PATCH /api/clubs/:id - Update club settings
 */
router.patch(
  '/:id',
  requireAuth,
  upload.single('profilePicture'),
  (req: Request, res: Response) => {
    void (async () => {
      try {
        const userId = req.session.userId
        const { id } = req.params
        const { name, description, isPublic } = req.body

        if (userId === undefined) {
          res.status(401).json({ error: 'Not authenticated' })
          return
        }

        const updateData: {
          name?: string
          description?: string
          profilePictureUrl?: string
          isPublic?: boolean
        } = {}

        // Validate and add name if provided
        if (name !== undefined && name !== null && name !== '') {
          if (typeof name !== 'string' || name.trim().length < 3) {
            res
              .status(400)
              .json({ error: 'Club name must be at least 3 characters' })
            return
          }

          if (name.trim().length > 50) {
            res
              .status(400)
              .json({ error: 'Club name must not exceed 50 characters' })
            return
          }

          updateData.name = name.trim()
        }

        // Validate and add description if provided
        if (description !== undefined && description !== null) {
          if (description !== '' && typeof description !== 'string') {
            res.status(400).json({ error: 'Description must be a string' })
            return
          }

          if (description.length > 500) {
            res
              .status(400)
              .json({ error: 'Description must not exceed 500 characters' })
            return
          }

          updateData.description =
            description.trim() !== '' ? description.trim() : null
        }

        // Add profile picture if uploaded
        if (req.file !== undefined) {
          updateData.profilePictureUrl = `/uploads/club-profiles/${req.file.filename}`
        }

        // Add isPublic if provided
        if (isPublic !== undefined) {
          updateData.isPublic = isPublic === 'true' || isPublic === true
        }

        const club = await clubService.updateClub(id, userId, updateData)
        res.json(club)
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message === 'Not a member of this club' ||
            error.message === 'Only admins can update club settings'
          ) {
            res.status(403).json({ error: error.message })
            return
          }
          if (error.message === 'A club with this name already exists') {
            res.status(409).json({ error: error.message })
            return
          }
        }
        console.error('Error updating club:', error)
        res.status(500).json({ error: 'Failed to update club' })
      }
    })()
  }
)

/**
 * POST /api/clubs/invitations/:id/accept - Accept a club invitation
 */
router.post(
  '/invitations/:id/accept',
  requireAuth,
  (req: Request, res: Response) => {
    void (async () => {
      try {
        const userId = req.session.userId
        const { id } = req.params

        if (userId === undefined) {
          res.status(401).json({ error: 'Not authenticated' })
          return
        }

        await clubService.acceptInvitation(id, userId)
        res.json({ message: 'Invitation accepted successfully' })
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message === 'Invitation not found' ||
            error.message === 'This invitation is not for you' ||
            error.message === 'This invitation has already been responded to' ||
            error.message === 'This invitation has expired' ||
            error.message === 'You are already a member of this club' ||
            error.message === 'Club has reached maximum member limit (12)'
          ) {
            res.status(400).json({ error: error.message })
            return
          }
        }
        console.error('Error accepting invitation:', error)
        res.status(500).json({ error: 'Failed to accept invitation' })
      }
    })()
  }
)

/**
 * POST /api/clubs/invitations/:id/reject - Reject a club invitation
 */
router.post(
  '/invitations/:id/reject',
  requireAuth,
  (req: Request, res: Response) => {
    void (async () => {
      try {
        const userId = req.session.userId
        const { id } = req.params

        if (userId === undefined) {
          res.status(401).json({ error: 'Not authenticated' })
          return
        }

        await clubService.rejectInvitation(id, userId)
        res.json({ message: 'Invitation rejected successfully' })
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message === 'Invitation not found' ||
            error.message === 'This invitation is not for you' ||
            error.message === 'This invitation has already been responded to'
          ) {
            res.status(400).json({ error: error.message })
            return
          }
        }
        console.error('Error rejecting invitation:', error)
        res.status(500).json({ error: 'Failed to reject invitation' })
      }
    })()
  }
)

/**
 * GET /api/clubs/:id/movies/history - Get movie history for a club
 */
router.get(
  '/:id/movies/history',
  requireAuth,
  (req: Request, res: Response) => {
    void (async () => {
      try {
        const userId = req.session.userId
        const { id } = req.params

        if (userId === undefined) {
          res.status(401).json({ error: 'Not authenticated' })
          return
        }

        const history = await movieService.getMovieHistory(id, userId)
        res.json(history)
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Not a member of this club') {
            res.status(403).json({ error: error.message })
            return
          }
        }
        console.error('Error getting movie history:', error)
        res.status(500).json({ error: 'Failed to get movie history' })
      }
    })()
  }
)

/**
 * GET /api/clubs/:id/rotation - Get rotation order for a club
 */
router.get('/:id/rotation', requireAuth, (req: Request, res: Response) => {
  void (async () => {
    try {
      const { id } = req.params
      const rotation = await movieService.getRotation(id)
      res.json(rotation)
    } catch (error) {
      console.error('Error getting rotation:', error)
      res.status(500).json({ error: 'Failed to get rotation' })
    }
  })()
})

/**
 * PUT /api/clubs/:id/rotation - Update rotation order (admin only)
 */
router.put('/:id/rotation', requireAuth, (req: Request, res: Response) => {
  void (async () => {
    try {
      const { id } = req.params
      const { userIds } = req.body as { userIds: string[] }
      const userId = req.session.userId

      if (userId === undefined) {
        res.status(401).json({ error: 'Not authenticated' })
        return
      }

      if (!Array.isArray(userIds)) {
        res.status(400).json({ error: 'userIds must be an array' })
        return
      }

      await movieService.updateRotation(id, userId, userIds)
      res.json({ message: 'Rotation updated successfully' })
    } catch (error) {
      console.error('Error updating rotation:', error)
      const message =
        error instanceof Error ? error.message : 'Failed to update rotation'
      res.status(400).json({ error: message })
    }
  })()
})

/**
 * POST /api/clubs/:id/rotation/randomize - Randomize rotation order (admin only)
 */
router.post(
  '/:id/rotation/randomize',
  requireAuth,
  (req: Request, res: Response) => {
    void (async () => {
      try {
        const { id } = req.params
        const userId = req.session.userId

        if (userId === undefined) {
          res.status(401).json({ error: 'Not authenticated' })
          return
        }

        await movieService.randomizeRotation(id, userId)
        res.json({ message: 'Rotation randomized successfully' })
      } catch (error) {
        console.error('Error randomizing rotation:', error)
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to randomize rotation'
        res.status(400).json({ error: message })
      }
    })()
  }
)

/**
 * GET /api/clubs/:id/movies/current - Get current movie state for a club
 */
router.get(
  '/:id/movies/current',
  requireAuth,
  (req: Request, res: Response) => {
    void (async () => {
      try {
        const { id } = req.params
        const userId = req.session.userId

        if (userId === undefined) {
          res.status(401).json({ error: 'Not authenticated' })
          return
        }

        const state = await movieService.getCurrentMovieState(id, userId)
        res.json(state)
      } catch (error) {
        console.error('Error getting current movie state:', error)
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to get current movie state'
        res.status(400).json({ error: message })
      }
    })()
  }
)

/**
 * POST /api/clubs/:id/movies/rounds - Start a new voting round
 */
router.post(
  '/:id/movies/rounds',
  requireAuth,
  (req: Request, res: Response) => {
    void (async () => {
      try {
        const { id } = req.params
        const userId = req.session.userId

        if (userId === undefined) {
          res.status(401).json({ error: 'Not authenticated' })
          return
        }

        const roundId = await movieService.startVotingRound(id, userId)
        res.json({ roundId })
      } catch (error) {
        console.error('Error starting voting round:', error)
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to start voting round'
        res.status(400).json({ error: message })
      }
    })()
  }
)

export default router
