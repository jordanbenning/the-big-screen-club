import type { Request, Response, NextFunction } from 'express'

import { authService } from '../services/authService'

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (
    req.session.userId === undefined ||
    req.session.userId === null ||
    req.session.userId === ''
  ) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  void (async () => {
    try {
      const user = await authService.getUserById(req.session.userId)

      if (user === null) {
        req.session.userId = undefined
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      // Attach user to request for downstream handlers
      ;(req as Request & { user: typeof user }).user = user
      next()
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })()
}

export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (
    req.session.userId !== undefined &&
    req.session.userId !== null &&
    req.session.userId !== ''
  ) {
    void (async () => {
      try {
        const user = await authService.getUserById(req.session.userId)

        if (user !== null) {
          ;(req as Request & { user: typeof user }).user = user
        }
      } catch {
        // Silently fail for optional auth
      }
      next()
    })()
  } else {
    next()
  }
}
