import { useState } from 'react'
import { submitGenerateJob } from '../api/jobs.api'
import type { GenerateRequest } from '../types'

interface UseGenerateJobResult {
  isSubmitting: boolean
  error:        string | null
  submit:       (payload: GenerateRequest) => Promise<string | null>
}

/**
 * useGenerateJob
 *
 * Handles the POST /api/jobs/generate call.
 * Returns the created jobId on success, or sets error on failure.
 * The caller decides what to do with the jobId (start polling, add to list).
 */
export function useGenerateJob(): UseGenerateJobResult {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const submit = async (payload: GenerateRequest): Promise<string | null> => {
    setIsSubmitting(true)
    setError(null)

    try {
      const { jobId } = await submitGenerateJob(payload)
      return jobId
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to submit job.'
      setError(message)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  return { isSubmitting, error, submit }
}
