import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"

import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma 7 requires an explicit driver adapter instead of the built-in
// query engine binary. Neon's TCP connections don't survive a serverless
// function being frozen and thawed between invocations (pg.Pool ends up
// trying to reuse a dead socket and hangs) — Vercel production uses Neon's
// WebSocket-based serverless driver instead, which has no persistent TCP
// connection to go stale. Local dev keeps plain pg against Docker Postgres,
// which isn't Neon and doesn't speak that protocol.
neonConfig.webSocketConstructor = ws

const isNeon = (process.env.DATABASE_URL ?? "").includes("neon.tech")
const adapter = isNeon
  ? new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
  : new PrismaPg(process.env.DATABASE_URL!)

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}
