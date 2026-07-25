import 'dotenv/config'

// ─────────────────────────────────────────────────────────────────────────────
// Fail-fast environment validation.
// All required variables are checked at process startup.
// If any are missing the process exits immediately with a clear message
// rather than failing silently at the call site.
// ─────────────────────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value || value.trim() === '') {
    // Crash early — a missing env var in production is always a config error.
    throw new Error(
      `[env] Missing required environment variable: "${key}". ` +
      `Check your .env file or deployment configuration.`,
    )
  }
  return value.trim()
}

function optionalEnv(key: string, fallback: string): string {
  const value = process.env[key]
  return value && value.trim() !== '' ? value.trim() : fallback
}

function requirePort(key: string, fallback: number): number {
  const raw = process.env[key]
  if (!raw) return fallback
  const parsed = parseInt(raw, 10)
  if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`[env] "${key}" must be a valid port number (1-65535), got: "${raw}"`)
  }
  return parsed
}

// Export a single frozen object so callers cannot mutate env at runtime.
export const env = Object.freeze({
  // ── Server ─────────────────────────────────────────────────────────────────
  PORT:        requirePort('PORT', 3000),
  NODE_ENV:    optionalEnv('NODE_ENV', 'development'),
  IS_PROD:     process.env['NODE_ENV'] === 'production',
  IS_DEV:      process.env['NODE_ENV'] !== 'production',

  // ── Database ───────────────────────────────────────────────────────────────
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // ── CORS ───────────────────────────────────────────────────────────────────
  CORS_ORIGIN: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),

  // ── Gemini ─────────────────────────────────────────────────────────────────
  // Optional — if not set, gemini.service.ts runs in mock mode.
  GEMINI_API_KEY: optionalEnv('GEMINI_API_KEY', 'your_gemini_api_key_here'),
})
