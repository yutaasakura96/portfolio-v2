// @vitest-environment node
import { describe, it, expect } from "vitest";
import { contactMessageSchema } from "./contact";

const validBase = {
  name: "Jane Doe",
  email: "jane@example.com",
  subject: "Hello",
  message: "This is a long enough message.",
};

describe("contactMessageSchema", () => {
  describe("happy path", () => {
    it("should accept a complete valid payload", () => {
      const parsed = contactMessageSchema.safeParse(validBase);
      expect(parsed.success).toBe(true);
    });

    it("should accept payloads with subject omitted (subject is optional)", () => {
      const { subject: _omit, ...rest } = validBase;
      void _omit;
      const parsed = contactMessageSchema.safeParse(rest);
      expect(parsed.success).toBe(true);
    });

    it("should accept an empty-string subject (literal('') branch)", () => {
      const parsed = contactMessageSchema.safeParse({ ...validBase, subject: "" });
      expect(parsed.success).toBe(true);
    });

    it("should accept an empty-string honeypot (must be empty)", () => {
      const parsed = contactMessageSchema.safeParse({ ...validBase, honeypot: "" });
      expect(parsed.success).toBe(true);
    });
  });

  describe("name boundaries", () => {
    it("should reject an empty name", () => {
      const parsed = contactMessageSchema.safeParse({ ...validBase, name: "" });
      expect(parsed.success).toBe(false);
    });

    it("should accept a 200-character name (upper bound)", () => {
      const parsed = contactMessageSchema.safeParse({
        ...validBase,
        name: "a".repeat(200),
      });
      expect(parsed.success).toBe(true);
    });

    it("should reject a 201-character name", () => {
      const parsed = contactMessageSchema.safeParse({
        ...validBase,
        name: "a".repeat(201),
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("email boundaries", () => {
    it("should reject an invalid email format", () => {
      const parsed = contactMessageSchema.safeParse({
        ...validBase,
        email: "not-an-email",
      });
      expect(parsed.success).toBe(false);
    });

    it("should reject an email longer than 254 characters", () => {
      // 249 a's + "@x.com" (6 chars) = 255 — one past the 254 cap.
      const longEmail = `${"a".repeat(249)}@x.com`;
      expect(longEmail.length).toBe(255);
      const parsed = contactMessageSchema.safeParse({ ...validBase, email: longEmail });
      expect(parsed.success).toBe(false);
    });
  });

  describe("message boundaries", () => {
    it("should reject a message shorter than 10 characters", () => {
      const parsed = contactMessageSchema.safeParse({ ...validBase, message: "too short" });
      expect(parsed.success).toBe(false);
    });

    it("should accept exactly 10 characters (lower bound)", () => {
      const parsed = contactMessageSchema.safeParse({
        ...validBase,
        message: "1234567890",
      });
      expect(parsed.success).toBe(true);
    });

    it("should accept a 5000-character message (upper bound)", () => {
      const parsed = contactMessageSchema.safeParse({
        ...validBase,
        message: "a".repeat(5000),
      });
      expect(parsed.success).toBe(true);
    });

    it("should reject a 5001-character message", () => {
      const parsed = contactMessageSchema.safeParse({
        ...validBase,
        message: "a".repeat(5001),
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("subject boundaries", () => {
    it("should accept a 300-character subject (upper bound)", () => {
      const parsed = contactMessageSchema.safeParse({
        ...validBase,
        subject: "s".repeat(300),
      });
      expect(parsed.success).toBe(true);
    });

    it("should reject a 301-character subject", () => {
      const parsed = contactMessageSchema.safeParse({
        ...validBase,
        subject: "s".repeat(301),
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("honeypot (spam trap)", () => {
    it("should reject a non-empty honeypot string", () => {
      const parsed = contactMessageSchema.safeParse({
        ...validBase,
        honeypot: "spam-bot-filled-this",
      });
      expect(parsed.success).toBe(false);
    });
  });
});
