// ─────────────────────────────────────────────────────────────────────────────
// Shared frontend types
// Mirror the backend API shapes so Axios responses are fully typed.
// ─────────────────────────────────────────────────────────────────────────────

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

// POST /api/jobs/generate — request body
export interface GenerateRequest {
  productName:    string
  description:    string
  referenceImage: string
}

// POST /api/jobs/generate — response data
export interface GenerateResponse {
  jobId: string
}

// GET /api/jobs/:id — response data
export interface Job {
  id:              string
  productName:     string
  status:          JobStatus
  generatedPrompt: string | null
  resultImage:     string | null
  createdAt:       string
  updatedAt:       string
}

// Generic API envelope matching the backend wrapper
export interface ApiSuccess<T> {
  success: true
  data:    T
}

export interface ApiError {
  success: false
  error: {
    message: string
    code?:   string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
