import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { backoffDelay, isRetryableDbError, withDbRetry } from "./db-resilience";

const captureException = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

describe("isRetryableDbError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("treats Neon cold-start 'fetch failed' as retryable", () => {
    expect(isRetryableDbError(new Error("fetch failed"))).toBe(true);
  });

  it("treats common transient connection errors as retryable", () => {
    for (const message of [
      "Connection terminated unexpectedly",
      "terminating connection due to administrator command",
      "socket hang up",
      "ECONNRESET",
      "ETIMEDOUT",
    ]) {
      expect(isRetryableDbError(new Error(message))).toBe(true);
    }
  });

  it("treats AbortError (by name) as retryable", () => {
    const error = new Error("aborted");
    error.name = "AbortError";
    expect(isRetryableDbError(error)).toBe(true);
  });

  it("does not retry genuine application errors", () => {
    expect(isRetryableDbError(new Error("Unique constraint failed"))).toBe(false);
  });

  it("handles non-Error values without throwing", () => {
    expect(isRetryableDbError("fetch failed")).toBe(true);
    expect(isRetryableDbError(null)).toBe(false);
    expect(isRetryableDbError(undefined)).toBe(false);
  });

  // The Neon WebSocket adapter (`PrismaNeon` via `ws`) throws DOM-style
  // ErrorEvent/CloseEvent objects — NOT Error instances — on connection
  // failures. These stringify to "[object ErrorEvent]" and must be retryable.
  it("treats a Neon WebSocket ErrorEvent as retryable", () => {
    class ErrorEvent {
      readonly type = "error";
      constructor(
        readonly message: string,
        readonly error?: unknown
      ) {}
    }
    expect(isRetryableDbError(new ErrorEvent(""))).toBe(true);
    expect(isRetryableDbError(new ErrorEvent("", new Error("connect ETIMEDOUT")))).toBe(true);
  });

  it("treats a WebSocket CloseEvent as retryable", () => {
    class CloseEvent {
      readonly type = "close";
      constructor(
        readonly code: number,
        readonly reason: string
      ) {}
    }
    expect(isRetryableDbError(new CloseEvent(1006, "abnormal closure"))).toBe(true);
  });

  it("unwraps a retryable error nested under `.cause`", () => {
    const wrapped = new Error("query failed");
    wrapped.cause = new Error("fetch failed");
    expect(isRetryableDbError(wrapped)).toBe(true);
  });

  it("does not retry a plain object with no transient signal", () => {
    expect(isRetryableDbError({ foo: "bar" })).toBe(false);
  });
});

describe("withDbRetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the result on first success without reporting", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withDbRetry(fn, "test", { baseDelayMs: 0 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(captureException).not.toHaveBeenCalled();
  });

  it("retries a transient failure and then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValue("recovered");
    await expect(withDbRetry(fn, "test", { baseDelayMs: 0 })).resolves.toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
    // Recovered before exhausting retries → no Sentry report.
    expect(captureException).not.toHaveBeenCalled();
  });

  it("retries up to the configured limit, then reports and rethrows", async () => {
    const error = new Error("fetch failed");
    const fn = vi.fn().mockRejectedValue(error);
    await expect(withDbRetry(fn, "getHero", { retries: 2, baseDelayMs: 0 })).rejects.toBe(error);
    // initial attempt + 2 retries = 3 calls
    expect(fn).toHaveBeenCalledTimes(3);
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        tags: expect.objectContaining({ dbQuery: "getHero" }),
      })
    );
  });

  it("does not retry non-retryable errors, but still reports and rethrows", async () => {
    const error = new Error("Unique constraint failed");
    const fn = vi.fn().mockRejectedValue(error);
    await expect(withDbRetry(fn, "getHero", { retries: 3, baseDelayMs: 0 })).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it("rethrows the original ErrorEvent but reports a normalized, readable Error to Sentry", async () => {
    class ErrorEvent {
      readonly type = "error";
      constructor(readonly message: string) {}
    }
    const event = new ErrorEvent("");
    const fn = vi.fn().mockRejectedValue(event);

    // Original object is rethrown unchanged (callers/Next.js see the real value).
    await expect(withDbRetry(fn, "getHero", { retries: 1, baseDelayMs: 0 })).rejects.toBe(event);
    // ErrorEvent is retryable now → initial attempt + 1 retry.
    expect(fn).toHaveBeenCalledTimes(2);
    // Sentry receives a real Error with a useful message (not "[object ErrorEvent]").
    expect(captureException).toHaveBeenCalledTimes(1);
    const [reported, context] = captureException.mock.calls[0] as [unknown, { tags?: unknown }];
    expect(reported).toBeInstanceOf(Error);
    expect((reported as Error).message).toContain("getHero");
    expect((reported as Error).message).toContain("ErrorEvent");
    expect(context).toMatchObject({ tags: { dbQuery: "getHero" } });
  });

  it("defaults to 5 attempts (4 retries) to bridge a Neon cold-wake window", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fetch failed"));
    await expect(withDbRetry(fn, "getHero", { baseDelayMs: 0 })).rejects.toThrow("fetch failed");
    // 1 initial attempt + 4 default retries.
    expect(fn).toHaveBeenCalledTimes(5);
  });

  it("succeeds on a late retry that previous (shorter) budgets would have missed", async () => {
    // Fails the first 3 attempts (old budget was 3 attempts total), recovers on the 4th.
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValue("warm");
    await expect(withDbRetry(fn, "getHero", { baseDelayMs: 0 })).resolves.toBe("warm");
    expect(fn).toHaveBeenCalledTimes(4);
    expect(captureException).not.toHaveBeenCalled();
  });
});

describe("backoffDelay", () => {
  it("grows exponentially from the base delay", () => {
    expect(backoffDelay(0, 250, 2000)).toBe(250);
    expect(backoffDelay(1, 250, 2000)).toBe(500);
    expect(backoffDelay(2, 250, 2000)).toBe(1000);
  });

  it("caps the delay at maxDelayMs", () => {
    expect(backoffDelay(3, 250, 2000)).toBe(2000); // 250*8 = 2000
    expect(backoffDelay(5, 250, 2000)).toBe(2000); // 250*32 = 8000 → capped
    expect(backoffDelay(10, 250, 2000)).toBe(2000);
  });

  it("returns 0 when the base delay is 0 (test fast-path)", () => {
    expect(backoffDelay(4, 0, 2000)).toBe(0);
  });
});
