import app from './app'
import { env } from './utils/env'
import { connectDatabase, disconnectDatabase } from './utils/prisma'

// ─────────────────────────────────────────────────────────────────────────────
// Server bootstrap
//
// Startup order:
//   1. Validate environment variables (happens inside env.ts on import)
//   2. Connect to the database and verify the connection with a ping
//   3. Start the HTTP server
//   4. Register graceful shutdown handlers for SIGTERM and SIGINT
//
// If the database is unreachable at startup the process exits immediately.
// This prevents the server from accepting requests it cannot fulfil and
// surfaces misconfiguration early (e.g. wrong DATABASE_URL in prod).
// ─────────────────────────────────────────────────────────────────────────────

let isShuttingDown = false

async function startServer(): Promise<void> {
  // ── Step 1: Database connection ──────────────────────────────────────────
  console.log('[server] Connecting to database...')
  try {
    await connectDatabase()
    console.log('[server] Database connected ✓')
  } catch (error) {
    console.error('[server] Failed to connect to database:', error)
    process.exit(1)
  }

  // ── Step 2: Start HTTP server ─────────────────────────────────────────────
  const server = app.listen(env.PORT, () => {
    console.log(
      `[server] Listening on http://localhost:${env.PORT} — environment: ${env.NODE_ENV}`,
    )
  })

  // ── Step 3: Graceful shutdown ─────────────────────────────────────────────
  // On SIGTERM (container stop, PM2 restart) or SIGINT (Ctrl+C):
  //   a) Stop accepting new connections
  //   b) Wait for in-flight requests to complete (server.close)
  //   c) Disconnect Prisma so the DB connection pool is released cleanly
  //   d) Exit with code 0 (success) so process managers don't restart
  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) return
    isShuttingDown = true

    console.log(`\n[server] Received ${signal}. Shutting down gracefully...`)

    server.close(async () => {
      console.log('[server] HTTP server closed. Disconnecting database...')
      try {
        await disconnectDatabase()
        console.log('[server] Database disconnected. Process exiting.')
        process.exit(0)
      } catch (err) {
        console.error('[server] Error during database disconnect:', err)
        process.exit(1)
      }
    })

    // Force shutdown if graceful close takes longer than 10 seconds.
    setTimeout(() => {
      console.error('[server] Forced shutdown after timeout.')
      process.exit(1)
    }, 10_000).unref() // .unref() so this timer doesn't prevent the event loop from exiting
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT',  () => void shutdown('SIGINT'))

  // ── Step 4: Unhandled rejection / exception guards ────────────────────────
  // These should never fire if the code is correct.
  // Log and exit so the process manager can restart cleanly.
  process.on('unhandledRejection', (reason) => {
    console.error('[server] Unhandled promise rejection:', reason)
    process.exit(1)
  })

  process.on('uncaughtException', (error) => {
    console.error('[server] Uncaught exception:', error)
    process.exit(1)
  })
}

// Run
startServer().catch((error: unknown) => {
  console.error('[server] Fatal startup error:', error)
  process.exit(1)
})
