// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { ApiError, ErrorCodes, withErrorHandler } from "./errors";

function makeRequest(url = "http://localhost/api/test"): NextRequest {
  return new NextRequest(new URL(url));
}

describe("ApiError", () => {
  it("should store message, statusCode, code, and details", () => {
    const err = new ApiError("boom", 418, ErrorCodes.CONFLICT, { field: "x" });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("boom");
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe(ErrorCodes.CONFLICT);
    expect(err.details).toEqual({ field: "x" });
  });

  it("should allow details to be omitted", () => {
    const err = new ApiError("nope", 404, ErrorCodes.NOT_FOUND);
    expect(err.details).toBeUndefined();
  });
});

describe("withErrorHandler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("happy path", () => {
    it("should pass the request through to the handler and return its response", async () => {
      const handler = vi.fn(async () => Response.json({ data: { ok: true } }, { status: 200 }));
      const wrapped = withErrorHandler(handler);

      const req = makeRequest();
      const res = await wrapped(req);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(req, undefined);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ data: { ok: true } });
    });

    it("should forward the context argument to the handler", async () => {
      const handler = vi.fn(async () => new Response(null, { status: 204 }));
      const wrapped = withErrorHandler<{ params: { id: string } }>(handler);

      const req = makeRequest();
      const ctx = { params: { id: "abc" } };
      const res = await wrapped(req, ctx);

      expect(handler).toHaveBeenCalledWith(req, ctx);
      expect(res.status).toBe(204);
    });
  });

  describe("ApiError path", () => {
    it("should serialize an ApiError to { error: { message, code } } with the right status", async () => {
      const wrapped = withErrorHandler(async () => {
        throw new ApiError("not allowed", 401, ErrorCodes.UNAUTHORIZED);
      });

      const res = await wrapped(makeRequest());
      expect(res.status).toBe(401);
      await expect(res.json()).resolves.toEqual({
        error: { message: "not allowed", code: ErrorCodes.UNAUTHORIZED },
      });
    });

    it("should include details when present", async () => {
      const details = { fieldErrors: { email: ["Invalid email"] } };
      const wrapped = withErrorHandler(async () => {
        throw new ApiError("Validation failed", 400, ErrorCodes.VALIDATION_ERROR, details);
      });

      const res = await wrapped(makeRequest());
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({
        error: {
          message: "Validation failed",
          code: ErrorCodes.VALIDATION_ERROR,
          details,
        },
      });
    });

    it("should NOT include the details key when details is undefined", async () => {
      const wrapped = withErrorHandler(async () => {
        throw new ApiError("not found", 404, ErrorCodes.NOT_FOUND);
      });

      const res = await wrapped(makeRequest());
      const body = (await res.json()) as { error: Record<string, unknown> };
      expect(body.error).not.toHaveProperty("details");
    });
  });

  describe("unknown-error path", () => {
    it("should return a 500 with the generic internal-error envelope", async () => {
      // Silence the expected console.error so test output stays clean
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const wrapped = withErrorHandler(async () => {
        throw new Error("kaboom");
      });

      const res = await wrapped(makeRequest());
      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({
        error: {
          message: "Internal server error",
          code: ErrorCodes.INTERNAL_ERROR,
        },
      });
      expect(errSpy).toHaveBeenCalledWith("Unhandled API error:", expect.any(Error));
    });

    it("should treat non-Error throws as unknown errors (still 500)", async () => {
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const wrapped = withErrorHandler(async () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "string error";
      });

      const res = await wrapped(makeRequest());
      expect(res.status).toBe(500);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(errSpy).toHaveBeenCalled();
    });
  });
});
