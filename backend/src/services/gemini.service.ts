import { env } from '../utils/env'

// ─────────────────────────────────────────────────────────────────────────────
// Gemini Service — Mock Mode
//
// The real Gemini API is not accessible in all regions.
// This mock generates a realistic Stable Diffusion prompt locally using
// the product name and description — no external API call is made.
//
// To restore the real Gemini integration:
//   1. Replace the body of generatePrompt() with the original API call
//   2. Set GEMINI_API_KEY in .env with a valid key
// ─────────────────────────────────────────────────────────────────────────────

const USE_MOCK = !env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'your_gemini_api_key_here'

/**
 * buildMockPrompt
 *
 * Constructs a deterministic, high-quality Stable Diffusion prompt
 * from the product name and description without calling any API.
 * The output is realistic enough to demonstrate the full pipeline.
 */
function buildMockPrompt(productName: string, description: string): string {
  return (
    `Professional product photography of ${productName}, ${description}, ` +
    `centered composition, 3/4 angle view, studio lighting with soft shadows, ` +
    `clean white backdrop, highly detailed, sharp focus, 8k resolution, ` +
    `commercial advertising style, photorealistic rendering`
  )
}

/**
 * generatePrompt
 *
 * Returns a Stable Diffusion prompt for the given product.
 * Uses the mock implementation when GEMINI_API_KEY is unavailable.
 * Simulates a short delay to keep the async pipeline behaviour realistic.
 *
 * @param productName  - Name of the product
 * @param description  - Product description
 * @returns A Stable Diffusion prompt string
 */
export async function generatePrompt(
  productName: string,
  description: string,
): Promise<string> {
  if (USE_MOCK) {
    console.log('[gemini] Running in mock mode — no API key required')

    // Simulate realistic API latency (0.5 s)
    await new Promise((resolve) => setTimeout(resolve, 500))

    const prompt = buildMockPrompt(productName, description)
    console.log(`[gemini] Mock prompt generated (${prompt.length} chars)`)
    return prompt
  }

  // ── Real Gemini API (only reached when a valid key is set) ────────────────
  const { GoogleGenerativeAI, FinishReason } = await import('@google/generative-ai')
  const { InternalServerError } = await import('../utils/httpError')

  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
    })

    const systemPrompt = `
You are an expert at writing Stable Diffusion image generation prompts.
Generate a single detailed prompt for professional product photography.
Include: studio lighting, soft shadows, centered composition, white backdrop, sharp focus.
Keep it concise (75-100 words). Output ONLY the prompt, no commentary.

PRODUCT NAME: ${productName}
PRODUCT DESCRIPTION: ${description}
PROMPT:`.trim()

    const result   = await model.generateContent(systemPrompt)
    const response = result.response
    const reason   = response.candidates?.[0]?.finishReason

    if (reason === FinishReason.SAFETY || reason === FinishReason.PROHIBITED_CONTENT) {
      throw InternalServerError('Content blocked by Gemini safety filters.', 'GEMINI_CONTENT_BLOCKED')
    }

    const text = response.text().trim()
    if (!text) throw InternalServerError('Gemini returned an empty response.', 'GEMINI_EMPTY_RESPONSE')

    return text
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[gemini] API call failed:', message)
    const { InternalServerError: ISE } = await import('../utils/httpError')
    throw ISE(`Gemini API error: ${message}`, 'GEMINI_API_ERROR')
  }
}
