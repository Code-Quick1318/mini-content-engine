import { Request, Response } from 'express'

/**
 * notFound middleware
 *
 * Catches any request that reaches the bottom of the middleware stack
 * without being handled by a route. Returns a consistent 404 JSON response.
 *
 * Must be registered AFTER all routes in app.ts.
 */
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      code: 'ROUTE_NOT_FOUND',
    },
  })
}
