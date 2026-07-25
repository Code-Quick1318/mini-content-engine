import { Request, Response, NextFunction, RequestHandler } from 'express'

/**
 * asyncHandler
 *
 * Wraps an async Express route handler so that any rejected promise
 * is automatically forwarded to the next() error middleware.
 *
 * Without this, an unhandled async error would silently hang the request.
 *
 * The generic P parameter threads the route params type through so
 * handlers typed with Request<{ id: string }> remain compatible.
 *
 * Usage:
 *   router.get('/jobs/:id', asyncHandler(jobController.getJob))
 */
export const asyncHandler = <P = Record<string, string>>(
  fn: (req: Request<P>, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler<P> =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
