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

/**
 * DOM-style event objects the Neon WebSocket adapter throws on socket failures
 * (via `ws`): `ErrorEvent` ("[object ErrorEvent]") and `CloseEvent`. These are
 * not `Error` instances and carry no useful `message`, but are always transient
 * connection failures — so we treat the event type itself as the retry signal.
 */
const RETRYABLE_EVENT_NAME = /ErrorEvent|CloseEvent/;

export function isRetryableDbError(error: unknown, depth = 0): boolean {
  if (error == null || depth > 3) return false;
  if (typeof error === "string") return RETRYABLE_MESSAGE.test(error);
  if (typeof error !== "object") return false;

  // WebSocket ErrorEvent/CloseEvent thrown by the Neon adapter — always transient.
  const ctorName = (error as { constructor?: { name?: string } }).constructor?.name ?? "";
  const name = (error as { name?: unknown }).name;
  if (
    RETRYABLE_EVENT_NAME.test(ctorName) ||
    (typeof name === "string" && RETRYABLE_NAME.test(name))
  ) {
    return true;
  }

  // Match on a string message field (covers Error and Error-like objects).
  const message = (error as { message?: unknown }).message;
  if (typeof message === "string" && RETRYABLE_MESSAGE.test(message)) return true;

  // Unwrap nested causes: `Error.cause`, an ErrorEvent's `.error`, AggregateError errors.
  const nested = error as { cause?: unknown; error?: unknown; errors?: unknown };
  if (isRetryableDbError(nested.cause, depth + 1)) return true;
  if (isRetryableDbError(nested.error, depth + 1)) return true;
  if (Array.isArray(nested.errors)) {
    return nested.errors.some((e) => isRetryableDbError(e, depth + 1));
  }

  return false;
}

interface WithDbRetryOptions {
  /**
   * Number of additional attempts after the first one. Default 4 (5 attempts
   * total). Sized to bridge a Neon free-tier cold-wake: when the compute is
   * suspended (scale-to-zero after 5 min idle), the first WebSocket handshake
   * often fails with "non-101 status code" while the compute resumes; the
   * default backoff schedule (≈250+500+1000+2000 ≈ 3.75s) keeps retrying long
   * enough for the resume to complete instead of giving up after ~300ms.
   */
  retries?: number;
  /** Base backoff in ms; attempt N waits `min(baseDelayMs * 2^N, maxDelayMs)`. Default 250. */
  baseDelayMs?: number;
  /** Upper bound for a single backoff wait, in ms. Default 2000. */
  maxDelayMs?: number;
}

/** Exponential backoff for attempt `attempt` (0-indexed), capped at `maxDelayMs`. */
export function backoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  return Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a human-readable description for a thrown value. Non-Error throwables
 * like the Neon adapter's `ErrorEvent` stringify to a useless "[object
 * ErrorEvent]", so we pull out the constructor name plus any `type`/`code`/
 * `message` fields to make Sentry reports actionable.
 */
function describeError(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const e = error as {
      message?: unknown;
      type?: unknown;
      code?: unknown;
      constructor?: { name?: string };
    };
    const parts = [
      e.constructor?.name && e.constructor.name !== "Object" ? e.constructor.name : "",
      typeof e.type === "string" ? `type=${e.type}` : "",
      e.code != null ? `code=${e.code}` : "",
      typeof e.message === "string" && e.message ? e.message : "",
    ].filter(Boolean);
    if (parts.length) return parts.join(" ");
  }
  return String(error);
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
  const { retries = 4, baseDelayMs = 250, maxDelayMs = 2000 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isRetryableDbError(error)) break;
      await sleep(backoffDelay(attempt, baseDelayMs, maxDelayMs));
    }
  }

  // Report a real Error (so Sentry shows a readable title instead of "[object
  // ErrorEvent]"), but rethrow the ORIGINAL value so caller/ISR semantics are
  // unchanged. Error instances are reported as-is to preserve their stack.
  const reported =
    lastError instanceof Error
      ? lastError
      : new Error(`Neon query "${label}" failed: ${describeError(lastError)}`);
  Sentry.captureException(reported, { tags: { dbQuery: label } });
  throw lastError;
}
