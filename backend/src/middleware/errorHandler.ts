import { Request, Response, NextFunction } from 'express'
import { HttpError } from '../utils/httpError'
import { env } from '../utils/env'

// ─────────────────────────────────────────────────────────────────────────────
// Global error handler
//
// Must be the LAST middleware registered in app.ts (4-argument signature).
// Express identifies it as an error handler via the 4-argument signature.
//
// Handles two categories of errors:
//   1. Operational errors (HttpError) — expected, user-facing, safe to expose
//   2. Programming errors (anything else) — unexpected, log and hide details
// ─────────────────────────────────────────────────────────────────────────────
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  // ── Operational error (thrown intentionally by app code) ─────────────────
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        // Stack only included in development for debugging
        ...(env.IS_DEV && { stack: err.stack }),
      },
    })
    return
  }

  // ── Programming / unexpected error ───────────────────────────────────────
  // Log the full error server-side but never expose internals to the client.
  console.error('[unhandled error]', {
    name:    err.name,
    message: err.message,
    stack:   err.stack,
  })

  res.status(500).json({
    success: false,
    error: {
      message: env.IS_PROD
        ? 'An unexpected error occurred. Please try again later.'
        : err.message,
      code: 'INTERNAL_SERVER_ERROR',
      ...(env.IS_DEV && { stack: err.stack }),
    },
  })
}
