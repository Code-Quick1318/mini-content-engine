import { Router } from 'express'
import { generate, getJob } from '../controllers/job.controller'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

// POST /api/jobs/generate  — create job, start pipeline, return jobId
router.post('/generate', asyncHandler(generate))

// GET  /api/jobs/:id       — poll job status + results
router.get('/:id', asyncHandler(getJob))

export default router
