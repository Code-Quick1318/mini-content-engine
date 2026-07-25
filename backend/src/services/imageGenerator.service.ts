import https from 'https'
import type { ImageGenerationInput, ImageGenerationResult } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Image Generator Service — Pollinations.AI
//
// Pollinations.AI is a free, open, no-auth image generation API.
// It accepts a text prompt and returns a real AI-generated image.
//
// API:  https://image.pollinations.ai/prompt/{encodedPrompt}
//       ?width=800&height=600&seed=42&model=flux&nologo=true
//
// No API key. No rate limit for reasonable use. Works in all regions.
//
// ── Replacing with ComfyUI later ─────────────────────────────────────────────
// Only this file needs to change. The public contract stays identical:
//   Input  → ImageGenerationInput  { prompt, referenceImage? }
//   Output → ImageGenerationResult { imageUrl }
// ─────────────────────────────────────────────────────────────────────────────

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt'

const IMAGE_CONFIG = {
  width:  800,
  height: 600,
  model:  'flux',   // flux = highest quality on Pollinations
  nologo: true,
} as const

/**
 * generateImage
 *
 * Calls Pollinations.AI to generate a real AI product image from a prompt.
 *
 * Steps:
 *   1. Build the Pollinations URL from the prompt + config
 *   2. Trigger the generation with an HTTPS HEAD request
 *      (this warms up the image on their CDN)
 *   3. Return the public image URL — the frontend renders it directly
 *
 * The image URL is permanent and publicly accessible — no download or
 * re-upload to cloud storage is needed.
 *
 * @param input.prompt         - Stable Diffusion prompt from Gemini
 * @param input.referenceImage - Optional reference image (unused by Pollinations)
 * @returns ImageGenerationResult containing the live image URL
 */
export async function generateImage(
  input: ImageGenerationInput,
): Promise<ImageGenerationResult> {
  console.log(
    `[imageGenerator] Generating image via Pollinations.AI for: "${input.prompt.slice(0, 60)}..."`,
  )

  const imageUrl = buildPollinationsUrl(input.prompt)

  // Trigger generation — Pollinations generates lazily on first request.
  // We make a HEAD request to warm it up so the frontend doesn't wait.
  await warmupImage(imageUrl)

  console.log(`[imageGenerator] Image ready → ${imageUrl}`)

  return { imageUrl }
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the Pollinations.AI image URL from the prompt and config.
 * A deterministic seed is derived from the prompt so the same prompt
 * always produces the same image (useful for caching / reproducibility).
 */
function buildPollinationsUrl(prompt: string): string {
  const encodedPrompt = encodeURIComponent(prompt)
  const seed = deriveSeeedFromPrompt(prompt)

  const params = new URLSearchParams({
    width:  String(IMAGE_CONFIG.width),
    height: String(IMAGE_CONFIG.height),
    model:  IMAGE_CONFIG.model,
    seed:   String(seed),
    nologo: String(IMAGE_CONFIG.nologo),
  })

  return `${POLLINATIONS_BASE}/${encodedPrompt}?${params.toString()}`
}

/**
 * Derives a numeric seed from the prompt string so the same prompt
 * always maps to the same image.
 */
function deriveSeeedFromPrompt(prompt: string): number {
  let hash = 0
  for (let i = 0; i < prompt.length; i++) {
    hash = (hash << 5) - hash + prompt.charCodeAt(i)
    hash |= 0 // convert to 32-bit int
  }
  return Math.abs(hash) % 2_147_483_647
}

/**
 * Makes an HTTPS GET request to trigger Pollinations image generation.
 * Pollinations generates images on-demand — this ensures the image is
 * ready before we return the URL to the job processor.
 * Times out after 30 seconds to avoid hanging the pipeline.
 */
function warmupImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      req.destroy()
      // Don't fail the job if warmup times out — URL is still valid,
      // the browser will load it when the frontend renders it.
      console.warn('[imageGenerator] Warmup timed out — URL still valid, continuing')
      resolve()
    }, 30_000)

    const req = https.get(url, (res) => {
      clearTimeout(timeout)
      // Consume the response body so the connection closes cleanly
      res.resume()
      res.on('end', () => resolve())
    })

    req.on('error', (err) => {
      clearTimeout(timeout)
      // Non-fatal — URL is still valid even if warmup fails
      console.warn(`[imageGenerator] Warmup request failed: ${err.message} — continuing`)
      resolve()
    })
  })
}
