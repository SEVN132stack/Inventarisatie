import { PrismaClient } from '@prisma/client'

// Tijdens `next build` initialiseert PrismaClient niet (geen DB beschikbaar).
// NEXT_PHASE=phase-production-build wordt door Next.js gezet tijdens de build.
// Op runtime (node server.js) is NEXT_PHASE niet gezet → normale werking.

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createClient() {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    // Return een lege proxy — wordt nooit echt aangeroepen tijdens build
    return new Proxy({} as PrismaClient, {
      get: () => () => Promise.resolve(null),
    })
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
