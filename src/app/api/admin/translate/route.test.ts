import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);

vi.mock("@/lib/prismaClient", () => ({
  prisma: {},
  Prisma: { JsonNull: "DbNull" },
}));
vi.mock("@/app/api/auth", () => ({
  requireAuth: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("translate route - prompt caching", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("sends system prompt as array with cache_control", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ type: "text", text: '{"heading":"テスト"}' }],
        }),
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost:3000/api/admin/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: "settings" }),
    });

    const { prisma } = await import("@/lib/prismaClient");
    (prisma as unknown as Record<string, unknown>).siteSettings = {
      findUnique: vi.fn().mockResolvedValue({
        id: "default",
        siteDescription: "Test description",
      }),
      update: vi.fn().mockResolvedValue({}),
    };

    await POST(request as never);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/messages");

    const body = JSON.parse(options.body);
    expect(body.system).toEqual([
      {
        type: "text",
        text: expect.stringContaining("translating a personal portfolio"),
        cache_control: { type: "ephemeral" },
      },
    ]);
  });
});
