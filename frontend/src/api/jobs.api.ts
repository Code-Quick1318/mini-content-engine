import apiClient from '../lib/axios'
import type { GenerateRequest, GenerateResponse, Job, ApiSuccess } from '../types'

/**
 * submitGenerateJob
 * POST /api/jobs/generate
 * Sends product details to the backend and returns the new job ID.
 */
export async function submitGenerateJob(payload: GenerateRequest): Promise<GenerateResponse> {
  const response = await apiClient.post<ApiSuccess<GenerateResponse>>(
    '/jobs/generate',
    payload,
  )
  return response.data.data
}

/**
 * fetchJob
 * GET /api/jobs/:id
 * Fetches the current state of a job. Used for polling.
 */
export async function fetchJob(jobId: string): Promise<Job> {
  const response = await apiClient.get<ApiSuccess<Job>>(`/jobs/${jobId}`)
  return response.data.data
}
