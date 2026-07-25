import { useState, useEffect, useRef } from 'react'
import { fetchJob } from '../api/jobs.api'
import type { Job } from '../types'

const POLL_INTERVAL_MS = 3000  // poll every 3 seconds
const TERMINAL_STATUSES = new Set(['completed', 'failed'])

interface UseJobPollingResult {
  job:    Job | null
  error:  string | null
}

/**
 * useJobPolling
 *
 * Polls GET /api/jobs/:id every 3 seconds until the job reaches a
 * terminal state (completed or failed), then stops automatically.
 *
 * Pass null or undefined as jobId to keep the hook inactive.
 */
export function useJobPolling(jobId: string | null): UseJobPollingResult {
  const [job,   setJob]   = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // No jobId — nothing to poll
    if (!jobId) {
      setJob(null)
      setError(null)
      return
    }

    const poll = async () => {
      try {
        const data = await fetchJob(jobId)
        setJob(data)
        setError(null)

        // Stop polling once we reach a terminal state
        if (TERMINAL_STATUSES.has(data.status)) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch job.'
        setError(message)
      }
    }

    // Fetch immediately, then on the interval
    void poll()
    intervalRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS)

    // Cleanup on unmount or when jobId changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [jobId])

  return { job, error }
}
