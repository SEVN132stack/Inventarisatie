import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createClient() {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return new Proxy({} as PrismaClient, {
      get: () => () => Promise.resolve(null),
    })
  }
  return new PrismaClient({
    log: ['error'],
  })
}

// Cache in alle omgevingen om connection pool uitputting te voorkomen
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createClient()

globalForPrisma.prisma = prisma
