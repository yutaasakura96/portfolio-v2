import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient, Prisma, ProjectStatus } from "../../generated/prisma/client";

const QUERY_TIMEOUT_MS = 10_000;

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {
  fetchOptions: { priority: "high", keepalive: true },
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

export { Prisma, ProjectStatus };

export async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);
      try {
        return await fn();
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      const isTransient =
        error instanceof Error &&
        (error.message.includes("fetch failed") ||
          error.message.includes("Connection terminated") ||
          error.message.includes("Error connecting to database"));

      if (!isTransient || attempt === retries) throw error;

      await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
    }
  }
  throw new Error("withRetry: unreachable");
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
