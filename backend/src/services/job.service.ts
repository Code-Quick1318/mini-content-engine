import { Job } from '@prisma/client'
import { prisma } from '../utils/prisma'
import { JobStatus, type CreateJobInput } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Job Service
//
// Owns all database interactions for the Job entity.
// Each function maps to exactly one operation — create or a single state
// transition. This keeps each function testable in isolation and makes the
// state machine in job.processor.ts easy to follow.
//
// Has no knowledge of HTTP — receives plain objects, returns plain objects.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * createJob
 *
 * Inserts a new Job row with status = pending.
 * Output fields (generatedPrompt, resultImage) are left null — they are
 * populated by the background processor as the pipeline advances.
 */
export async function createJob(input: CreateJobInput): Promise<Job> {
  return prisma.job.create({
    data: {
      productName:    input.productName,
      description:    input.description,
      referenceImage: input.referenceImage,
      // status defaults to `pending` per the Prisma schema
    },
  })
}

/**
 * findJobById
 *
 * Fetches a single job by its UUID.
 * Returns null when no matching row exists — the caller decides how to handle it.
 */
export async function findJobById(jobId: string): Promise<Job | null> {
  return prisma.job.findUnique({
    where: { id: jobId },
  })
}

/**
 * setJobProcessing
 *
 * Transitions status: pending → processing.
 * Called immediately before the Gemini API call so that concurrent
 * requests or polling clients can see the job is being worked on.
 */
export async function setJobProcessing(jobId: string): Promise<Job> {
  return prisma.job.update({
    where: { id: jobId },
    data:  { status: JobStatus.processing },
  })
}

/**
 * setJobCompleted
 *
 * Transitions status: processing → completed.
 * Stores the AI-generated prompt and the result image URL together in one
 * atomic write so the row is never in a partially-complete state.
 */
export async function setJobCompleted(
  jobId: string,
  generatedPrompt: string,
  resultImage: string,
): Promise<Job> {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status:          JobStatus.completed,
      generatedPrompt,
      resultImage,
    },
  })
}

/**
 * setJobFailed
 *
 * Transitions status: any → failed.
 * Called from the processor's catch block. Accepts an optional error
 * message so it can be logged server-side; the message is not stored in
 * the DB to keep the schema simple.
 */
export async function setJobFailed(jobId: string): Promise<Job> {
  return prisma.job.update({
    where: { id: jobId },
    data:  { status: JobStatus.failed },
  })
}
