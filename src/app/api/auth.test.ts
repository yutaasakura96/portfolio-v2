// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers' cookies() — controllable per-test via mockCookieValue.
let mockCookieValue: string | undefined;
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "access_token" && mockCookieValue !== undefined
        ? { name, value: mockCookieValue }
        : undefined,
  })),
}));

// Mock the Cognito JWT verifier — keep it free of jose / Cognito network calls.
const verifyJwtMock = vi.fn();
vi.mock("@/lib/aws/cognito", () => ({
  verifyJwt: (token: string) => verifyJwtMock(token),
}));

import { requireAuth, optionalAuth } from "./auth";
import { ApiError, ErrorCodes } from "@/lib/errors";

beforeEach(() => {
  vi.resetAllMocks();
  mockCookieValue = undefined;
});

describe("requireAuth", () => {
  it("should return the user when the cookie is present and the token verifies", async () => {
    mockCookieValue = "valid.jwt.token";
    verifyJwtMock.mockResolvedValueOnce({
      email: "admin@example.com",
      sub: "user-123",
    });

    const user = await requireAuth();

    expect(user).toEqual({ email: "admin@example.com", sub: "user-123" });
    expect(verifyJwtMock).toHaveBeenCalledWith("valid.jwt.token");
  });

  it("should throw a 401 ApiError when no access_token cookie is set", async () => {
    mockCookieValue = undefined;

    await expect(requireAuth()).rejects.toMatchObject({
      message: "Not authenticated",
      statusCode: 401,
      code: ErrorCodes.UNAUTHORIZED,
    });
    await expect(requireAuth()).rejects.toBeInstanceOf(ApiError);
    expect(verifyJwtMock).not.toHaveBeenCalled();
  });

  it("should throw a 401 ApiError when the token fails to verify", async () => {
    mockCookieValue = "bogus.jwt.token";
    verifyJwtMock.mockRejectedValueOnce(new Error("JWT expired"));

    await expect(requireAuth()).rejects.toMatchObject({
      message: "Invalid or expired token",
      statusCode: 401,
      code: ErrorCodes.UNAUTHORIZED,
    });
    await expect(requireAuth()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("optionalAuth", () => {
  it("should return the user when a valid cookie is present", async () => {
    mockCookieValue = "valid.jwt.token";
    verifyJwtMock.mockResolvedValue({ email: "admin@example.com", sub: "user-123" });

    const user = await optionalAuth();
    expect(user).toEqual({ email: "admin@example.com", sub: "user-123" });
  });

  it("should return null when no cookie is set (no throw)", async () => {
    mockCookieValue = undefined;
    await expect(optionalAuth()).resolves.toBeNull();
    expect(verifyJwtMock).not.toHaveBeenCalled();
  });

  it("should return null when the token fails to verify (no throw)", async () => {
    mockCookieValue = "bogus.jwt.token";
    verifyJwtMock.mockRejectedValueOnce(new Error("JWT expired"));

    await expect(optionalAuth()).resolves.toBeNull();
  });
});
