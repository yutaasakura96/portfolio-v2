// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────────

const requireAuthMock = vi.fn();
vi.mock("@/app/api/auth", () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

const rateLimitMock = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  getClientIp: () => "127.0.0.1",
}));

const findManyMock = vi.fn();
const findFirstMock = vi.fn();
vi.mock("@/lib/prismaClient", () => ({
  prisma: new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "$transaction") return vi.fn();
        return {
          findMany: (...args: unknown[]) => findManyMock(prop, ...args),
          findFirst: (...args: unknown[]) => findFirstMock(prop, ...args),
        };
      },
    }
  ),
}));

import { GET } from "./route";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeGet(params?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/admin/export/unified");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(url);
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  requireAuthMock.mockResolvedValue(undefined);
  rateLimitMock.mockResolvedValue({ success: true, remaining: 29, resetTime: 0 });
  findManyMock.mockResolvedValue([]);
  findFirstMock.mockResolvedValue(null);
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/admin/export/unified", () => {
  it("should return 429 when rate limit is exceeded", async () => {
    rateLimitMock.mockResolvedValueOnce({ success: false, remaining: 0, resetTime: 0 });
    const res = await GET(makeGet());
    expect(res.status).toBe(429);
  });

  it("should return 400 for non-JSON format", async () => {
    const res = await GET(makeGet({ format: "csv" }));
    expect(res.status).toBe(400);
  });

  it("should return JSON with Content-Disposition attachment header", async () => {
    const res = await GET(makeGet());
    expect(res.status).toBe(200);
    const disposition = res.headers.get("Content-Disposition");
    expect(disposition).toMatch(/^attachment; filename="all-entities-\d{4}-\d{2}-\d{2}\.json"$/);
    expect(res.headers.get("Content-Type")).toContain("application/json");
  });

  it("should return valid JSON body with entity keys", async () => {
    const res = await GET(makeGet());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty("skills");
    expect(body).toHaveProperty("projects");
  });

  it("should strip internal fields from collection rows", async () => {
    findManyMock.mockImplementation((model: string) => {
      if (model === "skill") {
        return [{ id: "s1", createdAt: "x", updatedAt: "y", name: "TS", category: "Lang" }];
      }
      return [];
    });

    const res = await GET(makeGet());
    const body = (await res.json()) as Record<string, unknown[]>;
    const skills = body.skills as Record<string, unknown>[];
    expect(skills).toHaveLength(1);
    expect(skills[0]).not.toHaveProperty("id");
    expect(skills[0]).not.toHaveProperty("createdAt");
    expect(skills[0]).toHaveProperty("name", "TS");
  });

  it("should strip internal fields from singleton rows", async () => {
    findFirstMock.mockImplementation((model: string) => {
      if (model === "hero") {
        return { id: "h1", createdAt: "x", updatedAt: "y", headline: "Hello" };
      }
      return null;
    });

    const res = await GET(makeGet());
    const body = (await res.json()) as Record<string, Record<string, unknown>>;
    expect(body.hero).toBeDefined();
    expect(body.hero).not.toHaveProperty("id");
    expect(body.hero).toHaveProperty("headline", "Hello");
  });
});
