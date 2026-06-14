// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted runs before vi.mock hoisting — safe to reference in factory closures.
const { prismaMock, verifyJwtMock } = vi.hoisted(() => {
  const prismaMock = {
    apiKey: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
  };
  const verifyJwtMock = vi.fn();
  return { prismaMock, verifyJwtMock };
});

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
vi.mock("@/lib/aws/cognito", () => ({
  verifyJwt: (token: string) => verifyJwtMock(token),
}));

// Mock the Prisma singleton — used by requireApiKey for DB lookups.
vi.mock("@/lib/prismaClient", () => ({
  prisma: prismaMock,
}));

import { requireAuth, optionalAuth, requireAuthOrApiKey } from "./auth";
import { ApiError, ErrorCodes } from "@/lib/errors";

beforeEach(() => {
  vi.resetAllMocks();
  mockCookieValue = undefined;
  // Restore the fire-and-forget update mock after resetAllMocks clears it.
  prismaMock.apiKey.update.mockResolvedValue({});
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

// Helper: build a minimal Request with an Authorization header.
function makeRequest(authHeader?: string): Request {
  const headers: Record<string, string> = {};
  if (authHeader !== undefined) headers["Authorization"] = authHeader;
  return new Request("http://localhost/api/test", { headers });
}

describe("requireAuthOrApiKey", () => {
  it("should return the user from the cookie when a valid cookie is present", async () => {
    mockCookieValue = "valid.jwt.token";
    verifyJwtMock.mockResolvedValueOnce({ email: "admin@example.com", sub: "user-123" });

    const user = await requireAuthOrApiKey(makeRequest());
    expect(user).toEqual({ email: "admin@example.com", sub: "user-123" });
    // Prisma should not be consulted when the cookie path succeeds.
    expect(prismaMock.apiKey.findUnique).not.toHaveBeenCalled();
  });

  it("should return a user when no cookie is set but a valid API key is provided", async () => {
    mockCookieValue = undefined;
    prismaMock.apiKey.findUnique.mockResolvedValueOnce({ id: "key-abc" });

    const user = await requireAuthOrApiKey(makeRequest("Bearer valid-raw-key"));
    expect(user).toEqual({ email: "api-key", sub: "apikey:key-abc" });
    expect(prismaMock.apiKey.findUnique).toHaveBeenCalledOnce();
  });

  it("should throw 401 when no cookie and no Authorization header", async () => {
    mockCookieValue = undefined;

    await expect(requireAuthOrApiKey(makeRequest())).rejects.toMatchObject({
      statusCode: 401,
      code: ErrorCodes.UNAUTHORIZED,
    });
    await expect(requireAuthOrApiKey(makeRequest())).rejects.toBeInstanceOf(ApiError);
  });

  it("should throw 401 when no cookie and an invalid API key is provided", async () => {
    mockCookieValue = undefined;
    prismaMock.apiKey.findUnique.mockResolvedValueOnce(null);

    await expect(requireAuthOrApiKey(makeRequest("Bearer bad-key"))).rejects.toMatchObject({
      statusCode: 401,
      code: ErrorCodes.UNAUTHORIZED,
    });
  });

  it("should use the cookie (not the API key) when both are present", async () => {
    mockCookieValue = "valid.jwt.token";
    verifyJwtMock.mockResolvedValueOnce({ email: "admin@example.com", sub: "user-123" });

    const user = await requireAuthOrApiKey(makeRequest("Bearer some-api-key"));
    // Cookie takes precedence — Prisma should not be consulted.
    expect(user).toEqual({ email: "admin@example.com", sub: "user-123" });
    expect(prismaMock.apiKey.findUnique).not.toHaveBeenCalled();
  });
});
