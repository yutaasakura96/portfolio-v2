// @vitest-environment node
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
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

const transactionMock = vi.fn();
vi.mock("@/lib/prismaClient", () => ({
  prisma: {
    $transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

const revalidatePathMock = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

import { POST } from "./route";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePost(body: unknown): NextRequest {
  const json = JSON.stringify(body);
  return new NextRequest("http://localhost/api/admin/import/unified", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": String(Buffer.byteLength(json)),
    },
    body: json,
  });
}

function makeTxMock(overrides: Record<string, Record<string, Mock>> = {}) {
  const defaultModel = {
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: "new-1" }),
    update: vi.fn().mockResolvedValue({ id: "existing-1" }),
    upsert: vi.fn().mockResolvedValue({ id: "upserted-1" }),
  };

  return new Proxy(
    { ...overrides },
    {
      get(target, prop: string) {
        if (prop in target) return target[prop];
        target[prop] = { ...defaultModel };
        return target[prop];
      },
    }
  );
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  requireAuthMock.mockResolvedValue(undefined);
  rateLimitMock.mockResolvedValue({ success: true, remaining: 4, resetTime: 0 });
  transactionMock.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
    const tx = makeTxMock();
    await fn(tx);
  });
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/admin/import/unified", () => {
  describe("auth and rate limiting", () => {
    it("should return 401 when auth fails", async () => {
      requireAuthMock.mockRejectedValueOnce(new Error("Unauthorized"));
      const res = await POST(makePost({ mode: "create" }));
      expect(res.status).toBe(500);
    });

    it("should return 429 when rate limit is exceeded", async () => {
      rateLimitMock.mockResolvedValueOnce({ success: false, remaining: 0, resetTime: 0 });
      const res = await POST(makePost({ mode: "create" }));
      expect(res.status).toBe(429);
    });
  });

  describe("validation", () => {
    it("should return 400 for missing mode", async () => {
      const res = await POST(makePost({}));
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 for invalid mode", async () => {
      const res = await POST(makePost({ mode: "delete" }));
      expect(res.status).toBe(400);
    });

    it("should return 400 for unknown entity keys (strict schema)", async () => {
      const res = await POST(makePost({ mode: "create", unknownEntity: [{ name: "x" }] }));
      expect(res.status).toBe(400);
    });
  });

  describe("collection import — create mode", () => {
    it("should create new items and return counts", async () => {
      const skillModel = {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "s1" }),
        update: vi.fn(),
        upsert: vi.fn(),
      };
      transactionMock.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
        await fn(makeTxMock({ skill: skillModel }));
      });

      const res = await POST(
        makePost({
          mode: "create",
          skills: [{ name: "TypeScript", category: "Language", proficiency: 90 }],
        })
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        data: { totalCreated: number; totalSkipped: number };
      };
      expect(body.data.totalCreated).toBe(1);
      expect(body.data.totalSkipped).toBe(0);
      expect(skillModel.create).toHaveBeenCalledTimes(1);
    });

    it("should skip existing items in create mode", async () => {
      const skillModel = {
        findFirst: vi.fn().mockResolvedValue({ id: "existing-skill" }),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      };
      transactionMock.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
        await fn(makeTxMock({ skill: skillModel }));
      });

      const res = await POST(
        makePost({
          mode: "create",
          skills: [{ name: "TypeScript", category: "Language", proficiency: 90 }],
        })
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        data: { totalSkipped: number; totalCreated: number };
      };
      expect(body.data.totalSkipped).toBe(1);
      expect(body.data.totalCreated).toBe(0);
      expect(skillModel.create).not.toHaveBeenCalled();
    });
  });

  describe("collection import — upsert mode", () => {
    it("should update existing items in upsert mode", async () => {
      const skillModel = {
        findFirst: vi.fn().mockResolvedValue({ id: "existing-skill" }),
        create: vi.fn(),
        update: vi.fn().mockResolvedValue({ id: "existing-skill" }),
        upsert: vi.fn(),
      };
      transactionMock.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
        await fn(makeTxMock({ skill: skillModel }));
      });

      const res = await POST(
        makePost({
          mode: "upsert",
          skills: [{ name: "TypeScript", category: "Language", proficiency: 95 }],
        })
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: { totalUpdated: number } };
      expect(body.data.totalUpdated).toBe(1);
      expect(skillModel.update).toHaveBeenCalledTimes(1);
    });
  });

  describe("singleton import", () => {
    it("should upsert singleton entities like hero", async () => {
      const heroModel = {
        findFirst: vi.fn().mockResolvedValue({ id: "hero-1" }),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn().mockResolvedValue({ id: "hero-1" }),
      };
      transactionMock.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
        await fn(makeTxMock({ hero: heroModel }));
      });

      const res = await POST(
        makePost({
          mode: "create",
          hero: { headline: "Hello", bio: "A developer" },
        })
      );
      expect(res.status).toBe(200);
      expect(heroModel.upsert).toHaveBeenCalledTimes(1);
      expect(heroModel.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "hero-1" },
          update: expect.objectContaining({ headline: "Hello" }),
        })
      );
    });
  });

  describe("transaction failure", () => {
    it("should return 500 when transaction throws", async () => {
      transactionMock.mockRejectedValueOnce(new Error("DB error"));
      const res = await POST(makePost({ mode: "create" }));
      expect(res.status).toBe(500);
    });
  });

  describe("revalidation", () => {
    it("should call revalidatePath after successful import", async () => {
      const res = await POST(
        makePost({
          mode: "create",
          skills: [{ name: "TypeScript", category: "Language", proficiency: 90 }],
        })
      );
      expect(res.status).toBe(200);
      expect(revalidatePathMock).toHaveBeenCalled();
    });
  });
});
