import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, Prisma, ProjectStatus } from "../../generated/prisma/client";

/**
 * Neon's serverless driver keeps a pool of WebSocket connections. On the Free
 * tier the compute auto-suspends after ~5 min idle and the server drops idle
 * sockets, which makes the underlying `ws` client emit an ASYNCHRONOUS 'error'
 * event with no associated query. Without listeners these surface as UNCAUGHT
 * exceptions ("[object ErrorEvent]" via Next.js `onRequestError`) even though no
 * request is affected — ISR keeps serving the last-good page.
 *
 * `onPoolError` / `onConnectionError` attach the missing listeners so an idle
 * socket dying is logged (and survivable — the next query opens a fresh
 * connection) instead of crashing as an uncaught error. Query-path failures are
 * a separate concern, retried by `withDbRetry` in `data/db-resilience.ts`.
 */
const adapter = new PrismaNeon(
  { connectionString: process.env.DATABASE_URL! },
  {
    onPoolError: (error) => {
      console.error("[neon] pool error (non-fatal, idle socket dropped):", error.message);
    },
    onConnectionError: (error) => {
      console.error("[neon] connection error (non-fatal):", error.message);
    },
  }
);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

export { Prisma, ProjectStatus };

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
