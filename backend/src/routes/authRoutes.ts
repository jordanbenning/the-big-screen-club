import express, {
  type Request,
  type Response,
  type RequestHandler,
} from 'express';

import { requireAuth } from '../middleware/authMiddleware';
import { authService } from '../services/authService';
import { emailService } from '../services/emailService';
import type {
  SignUpRequest,
  SignUpResponse,
  LoginRequest,
  LoginResponse,
} from '../types/auth';

const router = express.Router();

// Helper to wrap async route handlers
// eslint-disable-next-line no-unused-vars
type AsyncRequestHandler = (req: Request, res: Response) => Promise<void>;

const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res)).catch(next);
  };
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Username validation: alphanumeric, 3-20 chars
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// POST /api/auth/signup
router.post(
  '/signup',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, username } = req.body as SignUpRequest;

      // Validate input
      if (
        email === undefined ||
        password === undefined ||
        username === undefined
      ) {
        res
          .status(400)
          .json({ error: 'Email, password, and username are required' });
        return;
      }

      // Validate email format
      if (!EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      // Validate password strength
      if (!PASSWORD_REGEX.test(password)) {
        res.status(400).json({
          error:
            'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number',
        });
        return;
      }

      // Validate username
      if (!USERNAME_REGEX.test(username)) {
        res.status(400).json({
          error:
            'Username must be 3-20 characters and contain only letters, numbers, and underscores',
        });
        return;
      }

      // Create user
      const user = await authService.createUser(email, password, username);

      // Generate verification token
      const token = await authService.generateVerificationToken(user.id);

      // Send verification email
      await emailService.sendVerificationEmail(email, username, token);

      const response: SignUpResponse = {
        message:
          'Signup successful! Please check your email to verify your account.',
        email,
      };

      res.status(201).json(response);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Email already in use' ||
          error.message === 'Username already taken'
        ) {
          res.status(409).json({ error: error.message });
          return;
        }
      }

      console.error('Signup error:', error);
      res.status(500).json({ error: 'Failed to create account' });
    }
  })
);

// GET /api/auth/verify/:token
router.get(
  '/verify/:token',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params;

      if (token === undefined || token === '') {
        res.status(400).json({ error: 'Verification token is required' });
        return;
      }

      // Verify token and activate user
      const user = await authService.verifyToken(token);

      // Create session
      req.session.userId = user.id;

      // Redirect to frontend with success message
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
      res.redirect(`${frontendUrl}/verify-success`);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Invalid verification token' ||
          error.message === 'Verification token has expired'
        ) {
          const frontendUrl =
            process.env.FRONTEND_URL ?? 'http://localhost:5173';
          res.redirect(
            `${frontendUrl}/verify-error?message=${encodeURIComponent(error.message)}`
          );
          return;
        }
      }

      console.error('Verification error:', error);
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
      res.redirect(`${frontendUrl}/verify-error?message=Verification failed`);
    }
  })
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body as LoginRequest;

      // Validate input
      if (email === undefined || password === undefined) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Authenticate user
      const user = await authService.authenticateUser(email, password);

      // Create session
      req.session.userId = user.id;

      const response: LoginResponse = {
        message: 'Login successful',
        user,
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Invalid email or password' ||
          error.message === 'Please verify your email before logging in'
        ) {
          res.status(401).json({ error: error.message });
          return;
        }
      }

      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  })
);

// POST /api/auth/logout
router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      req.session.destroy((err) => {
        if (err !== undefined && err !== null) {
          console.error('Logout error:', err);
          res.status(500).json({ error: 'Logout failed' });
          return;
        }

        res.status(200).json({ message: 'Logout successful' });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  })
);

// GET /api/auth/me
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as Request & { user: { id: string } }).user;
      res.status(200).json({ user });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  })
);

export default router;
