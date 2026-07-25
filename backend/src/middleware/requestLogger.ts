import morgan, { StreamOptions } from 'morgan'
import { env } from '../utils/env'

// ─────────────────────────────────────────────────────────────────────────────
// Morgan request logger
//
// Development : colourised `dev` format — method, path, status, response time
// Production  : Apache Combined Log format — structured, parseable by log
//               aggregators (Datadog, CloudWatch, etc.)
// ─────────────────────────────────────────────────────────────────────────────

// Direct morgan output to stdout so it plays well with process managers
// (PM2, Docker) that capture stdout/stderr streams.
const stream: StreamOptions = {
  write: (message: string) => process.stdout.write(message),
}

// Skip logging for health-check endpoints to avoid noise in logs.
// The /health route is hit frequently by load balancers.
const skip = (req: { url?: string }): boolean => {
  return req.url === '/health'
}

export const requestLogger = env.IS_DEV
  ? morgan('dev', { stream, skip })
  : morgan('combined', { stream, skip })
