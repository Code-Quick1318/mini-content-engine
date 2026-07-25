import { generatePrompt } from './gemini.service'
import { generateImage } from './imageGenerator.service'
import {
  setJobProcessing,
  setJobCompleted,
  setJobFailed,
} from './job.service'
import type { ProcessJobInput } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Job Processor
//
// Orchestrates the full background pipeline for a single job.
// It is the ONLY place that calls gemini.service, image.service, and the
// state-transition functions on job.service together.
//
// Design rules:
//   - Never throws — all errors are caught and written to the DB as `failed`
//   - Never touches req / res — it is HTTP-agnostic
//   - Called with `void` by the controller so it does not block the response
//   - Each step is logged so failures can be diagnosed without a debugger
// ─────────────────────────────────────────────────────────────────────────────

/**
 * processJob
 *
 * Runs the full generation pipeline for a job asynchronously.
 *
 * Pipeline:
 *   pending → processing → (Gemini) → (image generation) → completed
 *                                                         ↘ failed (any error)
 *
 * The function is intentionally `void`-returning — the controller fires it
 * and moves on. All state is persisted to PostgreSQL so the client can poll
 * GET /api/jobs/:id to track progress.
 */
export async function processJob(input: ProcessJobInput): Promise<void> {
  const { jobId, productName, description } = input

  const tag = `[processor] job=${jobId}`

  try {
    // ── Step 1: Mark the job as processing ─────────────────────────────────
    // Immediately visible to polling clients. Proves the worker has started.
    await setJobProcessing(jobId)
    console.log(`${tag} status=processing`)

    // ── Step 2: Generate Stable Diffusion prompt via Gemini ────────────────
    console.log(`${tag} calling Gemini...`)
    const generatedPrompt = await generatePrompt(productName, description)
    console.log(`${tag} prompt generated (${generatedPrompt.length} chars)`)

    // ── Step 3: Generate image from the prompt ─────────────────────────────
    console.log(`${tag} calling image generator...`)
    const { imageUrl } = await generateImage({
      prompt:         generatedPrompt,
      referenceImage: input.referenceImage,
    })
    console.log(`${tag} image ready → ${imageUrl}`)

    // ── Step 4: Mark completed, persist both outputs atomically ────────────
    // Both outputs are written in a single DB update so the row is never
    // in a partially-complete state where prompt exists but image does not.
    await setJobCompleted(jobId, generatedPrompt, imageUrl)
    console.log(`${tag} status=completed`)

  } catch (error) {
    // ── Error path: any failure in the pipeline marks the job as failed ────
    // Log the full error server-side for diagnostics.
    // The client will see status=failed on their next poll.
    const message = error instanceof Error ? error.message : String(error)
    console.error(`${tag} status=failed reason="${message}"`)

    // Best-effort DB update — if this also fails, the job stays in its
    // previous state (processing) and can be detected as stale by a monitor.
    try {
      await setJobFailed(jobId)
    } catch (dbError) {
      const dbMessage = dbError instanceof Error ? dbError.message : String(dbError)
      console.error(`${tag} could not write failed status to DB: ${dbMessage}`)
    }
  }
}
