import path from 'path'

import express, {
  type Request,
  type Response,
  type RequestHandler,
} from 'express'
import type { FileFilterCallback } from 'multer'
import multer from 'multer'

import { requireAuth } from '../middleware/authMiddleware'
import { authService } from '../services/authService'
import { emailService } from '../services/emailService'
import type {
  SignUpRequest,
  SignUpResponse,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '../types/auth'

const router = express.Router()

// Helper to wrap async route handlers
// eslint-disable-next-line no-unused-vars
type AsyncRequestHandler = (req: Request, res: Response) => Promise<void>

const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res)).catch(next)
  }
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

// Username validation: alphanumeric, 3-20 chars
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/user-profiles'))
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    cb(null, `user-${uniqueSuffix}${ext}`)
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

// POST /api/auth/signup
router.post(
  '/signup',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, username } = req.body as SignUpRequest

      // Validate input
      if (
        email === undefined ||
        password === undefined ||
        username === undefined
      ) {
        res
          .status(400)
          .json({ error: 'Email, password, and username are required' })
        return
      }

      // Validate email format
      if (!EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: 'Invalid email format' })
        return
      }

      // Validate password strength
      if (!PASSWORD_REGEX.test(password)) {
        res.status(400).json({
          error:
            'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number',
        })
        return
      }

      // Validate username
      if (!USERNAME_REGEX.test(username)) {
        res.status(400).json({
          error:
            'Username must be 3-20 characters and contain only letters, numbers, and underscores',
        })
        return
      }

      // Create user
      const user = await authService.createUser(email, password, username)

      // Generate verification token
      const token = await authService.generateVerificationToken(user.id)

      // Send verification email
      await emailService.sendVerificationEmail(email, username, token)

      const response: SignUpResponse = {
        message:
          'Signup successful! Please check your email to verify your account.',
        email,
      }

      res.status(201).json(response)
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Email already in use' ||
          error.message === 'Username already taken'
        ) {
          res.status(409).json({ error: error.message })
          return
        }
      }

      console.error('Signup error:', error)
      res.status(500).json({ error: 'Failed to create account' })
    }
  })
)

// GET /api/auth/verify/:token
router.get(
  '/verify/:token',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params

      if (token === undefined || token === '') {
        res.status(400).json({ error: 'Verification token is required' })
        return
      }

      // Verify token and activate user
      const user = await authService.verifyToken(token)

      // Create session
      req.session.userId = user.id

      // Redirect to frontend with success message
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
      res.redirect(`${frontendUrl}/verify-success`)
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Invalid verification token' ||
          error.message === 'Verification token has expired'
        ) {
          const frontendUrl =
            process.env.FRONTEND_URL ?? 'http://localhost:5173'
          res.redirect(
            `${frontendUrl}/verify-error?message=${encodeURIComponent(error.message)}`
          )
          return
        }
      }

      console.error('Verification error:', error)
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
      res.redirect(`${frontendUrl}/verify-error?message=Verification failed`)
    }
  })
)

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, rememberMe } = req.body as LoginRequest

      // Validate input
      if (email === undefined || password === undefined) {
        res
          .status(400)
          .json({ error: 'Email/username and password are required' })
        return
      }

      // Authenticate user (now accepts email OR username)
      const user = await authService.authenticateUser(email, password)

      // Create session
      req.session.userId = user.id

      // Set cookie expiration based on "Remember Me" preference
      if (rememberMe === true) {
        // 30 days if "Remember Me" is checked
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30
      } else {
        // 7 days if "Remember Me" is not checked
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7
      }

      const response: LoginResponse = {
        message: 'Login successful',
        user,
      }

      res.status(200).json(response)
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Invalid credentials' ||
          error.message === 'Please verify your email before logging in'
        ) {
          res.status(401).json({ error: error.message })
          return
        }
      }

      console.error('Login error:', error)
      res.status(500).json({ error: 'Login failed' })
    }
  })
)

// POST /api/auth/logout
router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      req.session.destroy((err) => {
        if (err !== undefined && err !== null) {
          console.error('Logout error:', err)
          res.status(500).json({ error: 'Logout failed' })
          return
        }

        res.status(200).json({ message: 'Logout successful' })
      })
    } catch (error) {
      console.error('Logout error:', error)
      res.status(500).json({ error: 'Logout failed' })
    }
  })
)

// GET /api/auth/me
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as Request & { user: { id: string } }).user
      res.status(200).json({ user })
    } catch (error) {
      console.error('Get user error:', error)
      res.status(500).json({ error: 'Failed to get user' })
    }
  })
)

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body as ForgotPasswordRequest

      // Validate input
      if (email === undefined || email === '') {
        res.status(400).json({ error: 'Email is required' })
        return
      }

      // Validate email format
      if (!EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: 'Invalid email format' })
        return
      }

      try {
        // Request password reset - generates token and returns username
        const { username, token } =
          await authService.requestPasswordReset(email)

        // Send password reset email
        await emailService.sendPasswordResetEmail(email, username, token)
      } catch {
        // Silently handle errors - don't reveal if email exists
        console.log('Password reset request for non-existent email:', email)
      }

      // Always return success message for security
      const response: ForgotPasswordResponse = {
        message:
          'If an account exists with this email, a password reset link will be sent.',
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('Forgot password error:', error)
      res
        .status(500)
        .json({ error: 'Failed to process password reset request' })
    }
  })
)

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password } = req.body as ResetPasswordRequest

      // Validate input
      if (token === undefined || token === '') {
        res.status(400).json({ error: 'Reset token is required' })
        return
      }

      if (password === undefined || password === '') {
        res.status(400).json({ error: 'Password is required' })
        return
      }

      // Validate password strength
      if (!PASSWORD_REGEX.test(password)) {
        res.status(400).json({
          error:
            'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number',
        })
        return
      }

      // Reset password
      const user = await authService.resetPassword(token, password)

      // Create session (auto-login)
      req.session.userId = user.id

      const response: ResetPasswordResponse = {
        message: 'Password reset successful',
        user,
      }

      res.status(200).json(response)
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Invalid or expired reset token' ||
          error.message === 'Reset token has expired'
        ) {
          res.status(400).json({ error: error.message })
          return
        }
      }

      console.error('Reset password error:', error)
      res.status(500).json({ error: 'Failed to reset password' })
    }
  })
)

// POST /api/auth/resend-verification
router.post(
  '/resend-verification',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body as { email: string }

      // Validate input
      if (email === undefined || email === '') {
        res.status(400).json({ error: 'Email is required' })
        return
      }

      // Validate email format
      if (!EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: 'Invalid email format' })
        return
      }

      // Resend verification email
      const { username, token } =
        await authService.resendVerificationEmail(email)
      await emailService.sendVerificationEmail(email, username, token)

      res.status(200).json({
        message: 'Verification email sent! Please check your inbox.',
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          // Don't reveal if user exists for security
          res.status(200).json({
            message: 'Verification email sent! Please check your inbox.',
          })
          return
        }
        if (error.message === 'Email is already verified') {
          res.status(400).json({ error: 'Email is already verified' })
          return
        }
      }

      console.error('Resend verification error:', error)
      res.status(500).json({ error: 'Failed to resend verification email' })
    }
  })
)

// DELETE /api/auth/account
router.delete(
  '/account',
  requireAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { password } = req.body as { password: string }
      const userId = (req as Request & { user: { id: string } }).user.id

      // Validate input
      if (password === undefined || password === '') {
        res.status(400).json({ error: 'Password is required' })
        return
      }

      // Delete account
      const result = await authService.deleteAccount(userId, password)

      // Destroy session and send response after session is destroyed
      req.session.destroy((err) => {
        if (err !== undefined && err !== null) {
          console.error('Session destroy error:', err)
          res.status(500).json({ error: 'Failed to delete account' })
          return
        }
        res.status(200).json(result)
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid password') {
          res.status(401).json({ error: 'Invalid password' })
          return
        }
      }

      console.error('Delete account error:', error)
      res.status(500).json({ error: 'Failed to delete account' })
    }
  })
)

// PATCH /api/auth/profile - Update profile (username/email)
router.patch(
  '/profile',
  requireAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email } = req.body as {
        username?: string
        email?: string
      }
      const userId = (req as Request & { user: { id: string } }).user.id

      // Validate that at least one field is being updated
      if (username === undefined && email === undefined) {
        res
          .status(400)
          .json({ error: 'At least one field (username or email) is required' })
        return
      }

      // Validate username if provided
      if (username !== undefined && !USERNAME_REGEX.test(username)) {
        res.status(400).json({
          error:
            'Username must be 3-20 characters and contain only letters, numbers, and underscores',
        })
        return
      }

      // Validate email if provided
      if (email !== undefined && !EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: 'Invalid email format' })
        return
      }

      // Update profile
      const updatedUser = await authService.updateProfile(userId, {
        username,
        email,
      })

      res.status(200).json({
        message: 'Profile updated successfully',
        user: updatedUser,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Username already taken' ||
          error.message === 'Email already in use'
        ) {
          res.status(409).json({ error: error.message })
          return
        }
      }

      console.error('Update profile error:', error)
      res.status(500).json({ error: 'Failed to update profile' })
    }
  })
)

// PATCH /api/auth/password - Update password
router.patch(
  '/password',
  requireAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body as {
        currentPassword: string
        newPassword: string
      }
      const userId = (req as Request & { user: { id: string } }).user.id

      // Validate input
      if (currentPassword === undefined || currentPassword === '') {
        res.status(400).json({ error: 'Current password is required' })
        return
      }

      if (newPassword === undefined || newPassword === '') {
        res.status(400).json({ error: 'New password is required' })
        return
      }

      // Validate new password strength
      if (!PASSWORD_REGEX.test(newPassword)) {
        res.status(400).json({
          error:
            'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number',
        })
        return
      }

      // Update password
      const result = await authService.updatePassword(
        userId,
        currentPassword,
        newPassword
      )

      res.status(200).json(result)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Current password is incorrect') {
          res.status(401).json({ error: error.message })
          return
        }
      }

      console.error('Update password error:', error)
      res.status(500).json({ error: 'Failed to update password' })
    }
  })
)

// PATCH /api/auth/profile-picture - Upload profile picture
router.patch(
  '/profile-picture',
  requireAuth,
  upload.single('profilePicture'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as Request & { user: { id: string } }).user.id

      // Check if file was uploaded
      if (req.file === undefined) {
        res.status(400).json({ error: 'No profile picture provided' })
        return
      }

      // Get profile picture URL
      const profilePictureUrl = `/uploads/user-profiles/${req.file.filename}`

      // Update user profile picture
      const updatedUser = await authService.updateProfile(userId, {
        profilePictureUrl,
      })

      res.status(200).json({
        message: 'Profile picture updated successfully',
        user: updatedUser,
      })
    } catch (error) {
      console.error('Update profile picture error:', error)
      res.status(500).json({ error: 'Failed to update profile picture' })
    }
  })
)

export default router
