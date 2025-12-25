import path from 'path'

import express, { type Request, type Response } from 'express'
import multer, { type FileFilterCallback } from 'multer'

import { requireAuth } from '../middleware/authMiddleware'
import { clubService } from '../services/clubService'

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
  file: multer.File,
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

export default router
