import * as Sentry from "@sentry/nextjs";

/**
 * Transient Neon/Postgres failures that are safe to retry. The Neon serverless
 * WebSocket adapter (`PrismaNeon`) intermittently throws "fetch failed" and
 * connection-reset errors on Lambda cold starts; these almost always succeed on
 * an immediate retry. Genuine application errors (constraint violations, etc.)
 * are NOT matched here so they fail fast.
 */
const RETRYABLE_MESSAGE =
  /fetch failed|ECONNRESET|ETIMEDOUT|EPIPE|socket hang up|connection terminated|terminating connection|connection closed|connection reset|server has closed the connection|Can't reach database server/i;

const RETRYABLE_NAME = /AbortError|FetchError/i;

export function isRetryableDbError(error: unknown): boolean {
  if (typeof error === "string") return RETRYABLE_MESSAGE.test(error);
  if (!(error instanceof Error)) return false;
  return RETRYABLE_NAME.test(error.name) || RETRYABLE_MESSAGE.test(error.message);
}

interface WithDbRetryOptions {
  /** Number of additional attempts after the first one. Default 2 (3 attempts total). */
  retries?: number;
  /** Base backoff in ms; attempt N waits `baseDelayMs * 2^N`. Default 100. */
  baseDelayMs?: number;
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs a database query with bounded retries for transient connection failures.
 *
 * On a transient error it backs off and retries; on a non-retryable error it
 * fails immediately. Either way, once attempts are exhausted it reports the
 * error to Sentry (these failures are otherwise invisible) and **rethrows** so
 * the caller can decide whether to degrade or — for ISR pages — abort the
 * regeneration and let Next.js keep serving the last good cached page.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  label: string,
  options: WithDbRetryOptions = {}
): Promise<T> {
  const { retries = 2, baseDelayMs = 100 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isRetryableDbError(error)) break;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }

  Sentry.captureException(lastError, { tags: { dbQuery: label } });
  throw lastError;
}
