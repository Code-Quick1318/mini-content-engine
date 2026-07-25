/**
 * HttpError
 *
 * A custom Error subclass that carries an HTTP status code.
 * Thrown by controllers/services when a request should be rejected
 * with a specific status code (400, 404, etc.).
 *
 * The global error handler middleware (errorHandler.ts) reads the
 * `statusCode` field to set the response status.
 */
export class HttpError extends Error {
  public readonly statusCode: number
  public readonly code?: string // Optional machine-readable error code

  constructor(statusCode: number, message: string, code?: string) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
    this.code = code

    // Maintains proper stack trace in V8 (Chrome, Node)
    Error.captureStackTrace(this, this.constructor)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory functions for common HTTP errors
// ─────────────────────────────────────────────────────────────────────────────

export const BadRequest = (message: string, code?: string) =>
  new HttpError(400, message, code)

export const Unauthorized = (message: string = 'Unauthorized', code?: string) =>
  new HttpError(401, message, code)

export const Forbidden = (message: string = 'Forbidden', code?: string) =>
  new HttpError(403, message, code)

export const NotFound = (resource: string = 'Resource', code?: string) =>
  new HttpError(404, `${resource} not found`, code)

export const Conflict = (message: string, code?: string) =>
  new HttpError(409, message, code)

export const InternalServerError = (message: string = 'Internal server error', code?: string) =>
  new HttpError(500, message, code)
