import * as Sentry from "@sentry/nextjs";

/**
 * Benign Neon Free-tier cold-wake noise. The compute scales to zero after 5 min
 * idle (not disableable on Free); the next query cold-wakes it, and during that
 * window the WebSocket handshake / connection can fail. These are already
 * handled gracefully — `withDbRetry` retries them and ISR keeps serving the
 * last-good page — so every occurrence is HTTP 200 with 0 users impacted. They
 * are pure monitoring noise, so we drop them before they create Sentry issues.
 *
 * Matches: the unhandled `ws` ErrorEvent, the raw "Connection terminated"
 * Postgres error, the normalized `Neon query "..." failed:` reports from
 * withDbRetry, and the underlying transient connection signatures.
 *
 * NOTE: keep this list tight — these strings are Neon/ws-specific and will not
 * appear in a genuine application bug. A real DB outage still surfaces because
 * the homepage's ISR queries rethrow and Next falls back to the cached page.
 */
const NEON_COLD_WAKE_NOISE: Array<string | RegExp> = [
  /\[object ErrorEvent\]/,
  /Neon query ".*" failed:/,
  /Connection terminated unexpectedly/,
  /Received network error or non-101 status code/,
  /terminating connection due to/i,
  /Can't reach database server/i,
  /fetch failed/,
  /socket hang up/i,
];

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  ignoreErrors: NEON_COLD_WAKE_NOISE,
  debug: false,
});
