import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isRetryableDbError, withDbRetry } from "./db-resilience";

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
});
