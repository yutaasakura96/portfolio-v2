// @vitest-environment node
//
// Contact route unit tests.
//
// Decision: this file mocks the Prisma client narrowly (only `contactMessage.create`).
// `tests.md` prefers a real Neon test branch over per-test Prisma mocks, but no such
// branch is wired yet (CI uses no DB — see §10.3 in refactor-plan.md). The contact
// route's logic under test is route-level (honeypot, rate limit, validation, SES
// side-effect), not Prisma semantics — so mocking the single `create` call is
// acceptable here. Revisit once a Neon test branch lands.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────────

const rateLimitMock = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  getClientIp: () => "127.0.0.1",
}));

const sendContactNotificationMock = vi.fn();
vi.mock("@/lib/aws/ses", () => ({
  sendContactNotification: (...args: unknown[]) => sendContactNotificationMock(...args),
}));

const contactMessageCreateMock = vi.fn();
vi.mock("@/lib/prismaClient", () => ({
  prisma: {
    contactMessage: {
      create: (...args: unknown[]) => contactMessageCreateMock(...args),
    },
  },
}));

// Import the route AFTER mocks are registered.
import { POST } from "./route";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePost(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: "Jane Doe",
  email: "jane@example.com",
  subject: "Hello",
  message: "This is a long enough message body for the schema.",
};

beforeEach(() => {
  vi.resetAllMocks();
  // Default: rate limit passes, DB succeeds, SES succeeds.
  rateLimitMock.mockResolvedValue({
    success: true,
    remaining: 4,
    resetTime: Date.now() + 60_000,
  });
  contactMessageCreateMock.mockResolvedValue({
    id: "msg_abc123",
    ...validBody,
    createdAt: new Date(),
  });
  sendContactNotificationMock.mockResolvedValue(undefined);
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/contact", () => {
  describe("honeypot", () => {
    it("should silently succeed (200) and NOT touch the DB/rate-limiter/SES when honeypot is filled", async () => {
      const res = await POST(makePost({ ...validBody, honeypot: "I am a bot" }));

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({
        data: { message: "Your message has been sent successfully." },
      });
      expect(rateLimitMock).not.toHaveBeenCalled();
      expect(contactMessageCreateMock).not.toHaveBeenCalled();
      expect(sendContactNotificationMock).not.toHaveBeenCalled();
    });

    it("should treat an empty honeypot as legitimate and proceed", async () => {
      const res = await POST(makePost({ ...validBody, honeypot: "" }));
      expect(res.status).toBe(200);
      expect(rateLimitMock).toHaveBeenCalledTimes(1);
      expect(contactMessageCreateMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("rate limiting", () => {
    it("should pass the correct key + limit + window to rateLimit", async () => {
      await POST(makePost(validBody));
      expect(rateLimitMock).toHaveBeenCalledWith("contact:127.0.0.1", 5, 15 * 60 * 1000);
    });

    it("should return 429 with the RATE_LIMIT_EXCEEDED code when the limiter rejects", async () => {
      rateLimitMock.mockResolvedValueOnce({
        success: false,
        remaining: 0,
        resetTime: Date.now() + 60_000,
      });

      const res = await POST(makePost(validBody));
      expect(res.status).toBe(429);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(contactMessageCreateMock).not.toHaveBeenCalled();
      expect(sendContactNotificationMock).not.toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("should return 400 with VALIDATION_ERROR when the payload is invalid", async () => {
      const res = await POST(makePost({ ...validBody, email: "not-an-email" }));
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string; details: unknown } };
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toBeDefined();
      expect(contactMessageCreateMock).not.toHaveBeenCalled();
    });

    it("should return 400 when message is shorter than 10 chars", async () => {
      const res = await POST(makePost({ ...validBody, message: "short" }));
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("happy path", () => {
    it("should persist the message, fire SES, and return 200 with the success message", async () => {
      const res = await POST(makePost(validBody));

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({
        data: { message: "Your message has been sent successfully." },
      });

      expect(contactMessageCreateMock).toHaveBeenCalledWith({
        data: {
          name: "Jane Doe",
          email: "jane@example.com",
          subject: "Hello",
          message: validBody.message,
        },
      });

      expect(sendContactNotificationMock).toHaveBeenCalledTimes(1);
      expect(sendContactNotificationMock).toHaveBeenCalledWith({
        name: "Jane Doe",
        email: "jane@example.com",
        subject: "Hello",
        message: validBody.message,
        messageId: "msg_abc123",
      });
    });

    it("should default subject to '' when omitted", async () => {
      const { subject: _omit, ...withoutSubject } = validBody;
      void _omit;

      const res = await POST(makePost(withoutSubject));
      expect(res.status).toBe(200);

      expect(contactMessageCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ subject: "" }) })
      );
    });

    it("should still return 200 when SES fails (fire-and-forget)", async () => {
      // The route catches SES errors via `.catch(...)` and logs them; the response should still be 200.
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      sendContactNotificationMock.mockRejectedValueOnce(new Error("SES down"));

      const res = await POST(makePost(validBody));
      expect(res.status).toBe(200);

      // Give the unhandled promise rejection time to be caught
      await new Promise((r) => setImmediate(r));
      expect(errSpy).toHaveBeenCalledWith(
        "Failed to send contact notification email:",
        expect.any(Error)
      );
    });
  });
});
