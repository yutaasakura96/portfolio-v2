import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient, Prisma, ProjectStatus } from "../../generated/prisma/client";

const QUERY_TIMEOUT_MS = 10_000;

// Force fresh TCP connections on every query. Without this, Node 22's
// native fetch (backed by undici) reuses keep-alive sockets from its
// internal pool. Between Lambda invocations AWS kills idle connections,
// so the next request hits a dead socket → "TypeError: fetch failed".
// See: nodejs/undici#3133, neondatabase/serverless#146
neonConfig.fetchFunction = (url: string | URL | Request, init?: RequestInit) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);
  return fetch(url, {
    ...init,
    signal: controller.signal,
    headers: {
      ...Object.fromEntries(new Headers(init?.headers).entries()),
      Connection: "close",
    },
  }).finally(() => clearTimeout(timeout));
};

// NOTE: Do NOT add `keepalive: true` to fetchOptions — per the WHATWG Fetch
// spec it imposes a 64KB body limit, which breaks queries with large payloads.
const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {
  fetchOptions: { priority: "high" },
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

export { Prisma, ProjectStatus };

/**
 * Retry wrapper for transient Neon HTTP failures (fetch failed, connection
 * terminated). Query-level timeout is handled by neonConfig.fetchFunction
 * above — this only handles retry + backoff.
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isTransient =
        error instanceof Error &&
        (error.message.includes("fetch failed") ||
          error.message.includes("Connection terminated") ||
          error.message.includes("Error connecting to database") ||
          error.name === "AbortError");

      if (!isTransient || attempt === retries) throw error;

      await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
    }
  }
  throw new Error("withRetry: unreachable");
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
