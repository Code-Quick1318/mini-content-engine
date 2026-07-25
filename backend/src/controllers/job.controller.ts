import { Request, Response } from 'express'
import { createJob, findJobById } from '../services/job.service'
import { processJob } from '../services/job.processor'
import { BadRequest, NotFound } from '../utils/httpError'
import type { CreateJobBody, CreateJobResponse, JobResponse } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Job Controller
//
// Responsibilities:
//   1. Validate the incoming request
//   2. Call the appropriate service function
//   3. Send the HTTP response
//
// No business logic, no DB calls, no pipeline orchestration lives here.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/jobs/generate
 *
 * Creates a pending job, returns the job ID immediately (201),
 * then fires the background pipeline without blocking the response.
 */
export const generate = async (
  req: Request<unknown, unknown, CreateJobBody>,
  res: Response,
): Promise<void> => {
  const { productName, description, referenceImage } = req.body

  // ── Validation ─────────────────────────────────────────────────────────────
  const trimmedProductName    = productName?.toString().trim()
  const trimmedDescription    = description?.toString().trim()
  const trimmedReferenceImage = referenceImage?.toString().trim()

  if (!trimmedProductName) {
    throw BadRequest('productName is required and cannot be empty.', 'MISSING_PRODUCT_NAME')
  }
  if (!trimmedDescription) {
    throw BadRequest('description is required and cannot be empty.', 'MISSING_DESCRIPTION')
  }
  if (!trimmedReferenceImage) {
    throw BadRequest('referenceImage is required and cannot be empty.', 'MISSING_REFERENCE_IMAGE')
  }

  // ── Create job row (synchronous — must exist in DB before we respond) ──────
  const job = await createJob({
    productName:    trimmedProductName,
    description:    trimmedDescription,
    referenceImage: trimmedReferenceImage,
  })

  // ── Respond immediately ────────────────────────────────────────────────────
  const responseBody: CreateJobResponse = { jobId: job.id }
  res.status(201).json({ success: true, data: responseBody })

  // ── Fire pipeline (non-blocking, never awaited) ────────────────────────────
  void processJob({
    jobId:          job.id,
    productName:    trimmedProductName,
    description:    trimmedDescription,
    referenceImage: trimmedReferenceImage,
  })
}

/**
 * GET /api/jobs/:id
 *
 * Returns the current state of a job by UUID.
 * Clients poll this endpoint to track pipeline progress.
 *
 * 200 — job found, body contains status + all output fields
 * 404 — no job with the given ID exists
 */
export const getJob = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  const { id } = req.params

  const job = await findJobById(id)

  if (!job) {
    throw NotFound(`Job with id "${id}"`, 'JOB_NOT_FOUND')
  }

  // Dates are serialised to ISO strings for consistent cross-platform parsing.
  const responseBody: JobResponse = {
    id:              job.id,
    productName:     job.productName,
    status:          job.status,
    generatedPrompt: job.generatedPrompt,
    resultImage:     job.resultImage,
    createdAt:       job.createdAt.toISOString(),
    updatedAt:       job.updatedAt.toISOString(),
  }

  res.status(200).json({ success: true, data: responseBody })
}
