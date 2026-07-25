import express, { Application } from 'express'
import helmet from 'helmet'
import cors from 'cors'

import { env } from './utils/env'
import { requestLogger } from './middleware/requestLogger'
import { notFound } from './middleware/notFound'
import { errorHandler } from './middleware/errorHandler'
import router from './routes'

// ─────────────────────────────────────────────────────────────────────────────
// Application factory
//
// Middleware registration order is intentional and must not be changed:
//   1. Security headers (helmet) — before any response is sent
//   2. CORS — before route handlers so pre-flight OPTIONS is handled
//   3. Request logger — early, so every request is recorded
//   4. Body parsers — before controllers read req.body
//   5. Routes — business logic
//   6. 404 handler — after all routes, catches unmatched requests
//   7. Error handler — always last, 4-arg signature required by Express
// ─────────────────────────────────────────────────────────────────────────────
const app: Application = express()

// ── 1. Security headers ──────────────────────────────────────────────────────
// Sets a sensible collection of HTTP response headers:
// X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, etc.
// Protects against common web vulnerabilities with zero config.
app.use(helmet())

// ── 2. CORS ──────────────────────────────────────────────────────────────────
// Only the configured origin is allowed to make cross-origin requests.
// credentials:true enables cookies / auth headers over CORS.
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

// ── 3. Request logger ────────────────────────────────────────────────────────
// Morgan: dev format in development, combined (Apache) format in production.
// Health check requests are excluded to reduce noise.
app.use(requestLogger)

// ── 4. Body parsers ──────────────────────────────────────────────────────────
// Limit request body to 1 MB to prevent simple DoS via large payloads.
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ── 5. Routes ────────────────────────────────────────────────────────────────
// All API routes are prefixed with /api.
// Individual feature routers are mounted inside routes/index.ts.
app.use('/api', router)

// ── 6. 404 handler ───────────────────────────────────────────────────────────
// Any request that falls through all route handlers reaches this middleware.
// Returns a consistent JSON 404 response.
app.use(notFound)

// ── 7. Global error handler ──────────────────────────────────────────────────
// Must be registered last. Catches errors forwarded via next(err).
// Distinguishes between operational HttpErrors and unexpected crashes.
app.use(errorHandler)

export default app
