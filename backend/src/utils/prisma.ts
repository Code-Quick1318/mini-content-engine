import { PrismaClient } from '@prisma/client'
import { env } from './env'

// ─────────────────────────────────────────────────────────────────────────────
// Prisma singleton
//
// A single PrismaClient instance is shared across the entire application.
// Without this guard, every hot-reload in development would create a new
// connection pool and exhaust the database connections.
// ─────────────────────────────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log: env.IS_DEV
      ? [
          { level: 'query', emit: 'event' },
          { level: 'warn',  emit: 'stdout' },
          { level: 'error', emit: 'stdout' },
        ]
      : [{ level: 'error', emit: 'stdout' }],
  })

// Pin the instance to globalThis in non-production so nodemon reuse it.
if (env.IS_DEV) {
  globalThis.__prisma = prisma
}

// ─────────────────────────────────────────────────────────────────────────────
// Connection helpers
// Called by the server startup / shutdown hooks in index.ts.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Opens the Prisma connection pool and verifies the DB is reachable.
 * A raw `$queryRaw` ping is used instead of `$connect()` alone because
 * `$connect()` is lazy — it does not actually send a query.
 */
export async function connectDatabase(): Promise<void> {
  await prisma.$connect()
  await prisma.$queryRaw`SELECT 1` // confirm the DB is reachable
}

/**
 * Gracefully closes all open connections in the Prisma connection pool.
 * Must be called on SIGTERM / SIGINT so in-flight queries finish cleanly.
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}
