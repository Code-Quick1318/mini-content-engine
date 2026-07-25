import { Request, Response } from 'express'

/**
 * GET /api/health
 *
 * Lightweight liveness check.
 * Returns a fixed JSON payload confirming the server is running.
 * No database call — this is intentionally fast so load balancers
 * and uptime monitors get an immediate response.
 */
export const healthCheck = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'Server Running',
  })
}
