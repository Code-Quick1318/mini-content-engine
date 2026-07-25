import { JobStatus } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// Generic API envelope
// Every response from this API is wrapped in this shape so the frontend
// always knows where to find data, errors, and metadata.
// ─────────────────────────────────────────────────────────────────────────────
export interface ApiSuccess<T = unknown> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: {
    message: string
    code?: string
    // Only included in development mode
    stack?: string
  }
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

// ─────────────────────────────────────────────────────────────────────────────
// Health check response
// ─────────────────────────────────────────────────────────────────────────────
export interface HealthResponse {
  status: 'ok' | 'degraded'
  timestamp: string
  uptime: number          // process uptime in seconds
  environment: string
  services: {
    database: 'connected' | 'disconnected'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Job types (request / response shapes)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Raw shape of the JSON body sent by the client on POST /api/jobs/generate.
 * All fields arrive as unknown — the controller validates them before use.
 */
export interface CreateJobBody {
  productName: string
  description: string
  referenceImage: string
}

/**
 * Validated, typed input passed from the controller into the service.
 * At this point all fields are guaranteed to be non-empty strings.
 */
export interface CreateJobInput {
  productName: string
  description: string
  referenceImage: string
}

/**
 * Shape returned by POST /api/jobs/generate.
 * The client stores this ID and uses it to poll GET /api/jobs/:id.
 */
export interface CreateJobResponse {
  jobId: string
}

/**
 * Full job record returned by GET /api/jobs/:id.
 * Contains only the fields the client needs to track progress and
 * display results — input fields are excluded to keep the response minimal.
 */
export interface JobResponse {
  id:              string
  productName:     string
  status:          JobStatus
  generatedPrompt: string | null
  resultImage:     string | null
  createdAt:       string
  updatedAt:       string
}

// Re-export Prisma's JobStatus enum so application code
// never imports directly from @prisma/client
export { JobStatus }

// ─────────────────────────────────────────────────────────────────────────────
// Gemini service types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Input shape for gemini.service.ts — generatePrompt()
 * Kept separate from CreateJobInput so Gemini logic can evolve independently.
 */
export interface GeneratePromptInput {
  productName: string
  description: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Image generator service types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Input passed to imageGenerator.service.ts — generateImage()
 *
 * `prompt`         — Stable Diffusion prompt produced by Gemini.
 * `referenceImage` — Optional URL of the client's reference image.
 *                    The mock ignores it; a real ComfyUI workflow would
 *                    use it as an img2img conditioning input.
 */
export interface ImageGenerationInput {
  prompt: string
  referenceImage?: string
}

/**
 * Value returned by imageGenerator.service.ts — generateImage()
 * Wrapping the URL in an object (rather than returning a bare string) means
 * the real provider can add extra fields (width, height, seed, etc.) later
 * without changing any call sites.
 */
export interface ImageGenerationResult {
  imageUrl: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Job processor types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Input passed from the controller into the background processor.
 * Contains everything the processor needs to run the full pipeline
 * without re-querying the database for the initial fields.
 */
export interface ProcessJobInput {
  jobId: string
  productName: string
  description: string
  referenceImage: string
}
