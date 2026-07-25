import { Router } from 'express'
import healthRouter from './health.routes'
import jobRouter from './job.routes'

// ─────────────────────────────────────────────────────────────────────────────
// Root API router
//
// All routes are mounted here and prefixed under /api (set in app.ts).
// Add new feature routers as vertical slices are implemented.
// ─────────────────────────────────────────────────────────────────────────────
const router = Router()

// GET  /api/health
router.use('/health', healthRouter)

// POST /api/jobs/generate
// GET  /api/jobs/:id   (coming next)
router.use('/jobs', jobRouter)

export default router
