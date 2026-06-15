// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────────

const jwtVerifyMock = vi.fn();
vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn().mockReturnValue("fake-jwks"),
  jwtVerify: (...args: unknown[]) => jwtVerifyMock(...args),
}));

// Set env vars before module import
vi.stubEnv("COGNITO_REGION", "us-east-1");
vi.stubEnv("COGNITO_USER_POOL_ID", "us-east-1_TestPool");

import { proxy } from "./proxy";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(pathname: string, cookie?: string): NextRequest {
  const url = `http://localhost${pathname}`;
  const headers: Record<string, string> = {};
  if (cookie) {
    headers.cookie = `access_token=${cookie}`;
  }
  return new NextRequest(url, { headers });
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("proxy", () => {
  describe("bypass routes", () => {
    it("should pass /admin/login through without JWT check", async () => {
      const res = await proxy(makeRequest("/admin/login"));
      expect(res.status).toBe(200);
      expect(jwtVerifyMock).not.toHaveBeenCalled();
    });

    it("should pass /api/auth/callback through without JWT check", async () => {
      const res = await proxy(makeRequest("/api/auth/callback"));
      expect(res.status).toBe(200);
      expect(jwtVerifyMock).not.toHaveBeenCalled();
    });

    it("should pass /api/auth/signout through without JWT check", async () => {
      const res = await proxy(makeRequest("/api/auth/signout"));
      expect(res.status).toBe(200);
      expect(jwtVerifyMock).not.toHaveBeenCalled();
    });
  });

  describe("protected /admin/* routes", () => {
    it("should redirect to login when no access_token cookie exists", async () => {
      const res = await proxy(makeRequest("/admin/dashboard"));
      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/admin/login");
      expect(location.searchParams.get("redirect")).toBe("/admin/dashboard");
    });

    it("should redirect to login when JWT verification fails", async () => {
      jwtVerifyMock.mockRejectedValueOnce(new Error("invalid token"));
      const res = await proxy(makeRequest("/admin/dashboard", "bad-token"));
      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/admin/login");
    });

    it("should pass through when JWT is valid", async () => {
      jwtVerifyMock.mockResolvedValueOnce({ payload: { sub: "user1" } });
      const res = await proxy(makeRequest("/admin/dashboard", "valid-token"));
      expect(res.status).toBe(200);
      expect(jwtVerifyMock).toHaveBeenCalledTimes(1);
    });

    it("should encode the original pathname in the redirect query param", async () => {
      const res = await proxy(makeRequest("/admin/projects/edit/abc"));
      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.searchParams.get("redirect")).toBe("/admin/projects/edit/abc");
    });
  });

  describe("non-admin routes", () => {
    it("should pass through without any JWT check", async () => {
      const res = await proxy(makeRequest("/projects"));
      expect(res.status).toBe(200);
      expect(jwtVerifyMock).not.toHaveBeenCalled();
    });
  });
});
