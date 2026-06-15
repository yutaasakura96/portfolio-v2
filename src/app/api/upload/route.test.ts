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

const uploadToS3Mock = vi.fn();
const deleteImageVariantsMock = vi.fn();
vi.mock("@/lib/aws/s3", () => ({
  uploadToS3: (...args: unknown[]) => uploadToS3Mock(...args),
  deleteImageVariants: (...args: unknown[]) => deleteImageVariantsMock(...args),
}));

const processImageMock = vi.fn();
const processProfileImageMock = vi.fn();
const processLogoImageMock = vi.fn();
const processCertificateImageMock = vi.fn();
const processFeaturedImageMock = vi.fn();
const processEducationDocumentImageMock = vi.fn();
vi.mock("@/lib/image-processor", () => ({
  processImage: (...args: unknown[]) => processImageMock(...args),
  processProfileImage: (...args: unknown[]) => processProfileImageMock(...args),
  processLogoImage: (...args: unknown[]) => processLogoImageMock(...args),
  processCertificateImage: (...args: unknown[]) => processCertificateImageMock(...args),
  processFeaturedImage: (...args: unknown[]) => processFeaturedImageMock(...args),
  processEducationDocumentImage: (...args: unknown[]) => processEducationDocumentImageMock(...args),
}));

vi.mock("nanoid", () => ({
  nanoid: () => "test-id-12ch",
}));

import { POST, DELETE } from "./route";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeProcessedPair(prefix: string) {
  return {
    display: { buffer: Buffer.from("d"), key: `${prefix}/display.webp`, contentType: "image/webp" },
    original: {
      buffer: Buffer.from("o"),
      key: `${prefix}/original.webp`,
      contentType: "image/webp",
    },
  };
}

function makeFeaturedPair(prefix: string) {
  return {
    featured: {
      buffer: Buffer.from("f"),
      key: `${prefix}/featured.webp`,
      contentType: "image/webp",
    },
    original: {
      buffer: Buffer.from("o"),
      key: `${prefix}/original.webp`,
      contentType: "image/webp",
    },
  };
}

function makeImageVariants(prefix: string) {
  return {
    thumbnail: { buffer: Buffer.from("t"), key: `${prefix}/thumb.webp`, contentType: "image/webp" },
    medium: { buffer: Buffer.from("m"), key: `${prefix}/med.webp`, contentType: "image/webp" },
    large: { buffer: Buffer.from("l"), key: `${prefix}/lg.webp`, contentType: "image/webp" },
    original: { buffer: Buffer.from("o"), key: `${prefix}/orig.webp`, contentType: "image/webp" },
  };
}

function makeUpload(fields: {
  file?: { name?: string; type?: string; content?: string; size?: number };
  folder?: string;
  entityId?: string;
  variant?: string;
}): NextRequest {
  const formData = new FormData();
  if (fields.file !== undefined) {
    const content = fields.file.content ?? "fake-image-data";
    let blob: Blob;
    if (fields.file.size) {
      blob = new Blob([new ArrayBuffer(fields.file.size)], {
        type: fields.file.type ?? "image/png",
      });
    } else {
      blob = new Blob([content], { type: fields.file.type ?? "image/png" });
    }
    formData.append("file", blob, fields.file.name ?? "test.png");
  }
  if (fields.folder !== undefined) formData.append("folder", fields.folder);
  if (fields.entityId !== undefined) formData.append("entityId", fields.entityId);
  if (fields.variant !== undefined) formData.append("variant", fields.variant);

  return new NextRequest("http://localhost/api/upload", {
    method: "POST",
    body: formData,
  });
}

function makeDelete(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/upload", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  requireAuthMock.mockResolvedValue(undefined);
  rateLimitMock.mockResolvedValue({ success: true, remaining: 19, resetTime: Date.now() + 60_000 });
  uploadToS3Mock.mockImplementation(
    (_buf: unknown, key: string) => `https://cdn.example.com/${key}`
  );
  deleteImageVariantsMock.mockResolvedValue(undefined);
  processImageMock.mockResolvedValue(makeImageVariants("projects"));
  processProfileImageMock.mockResolvedValue(makeProcessedPair("profile"));
  processLogoImageMock.mockResolvedValue(makeProcessedPair("logos"));
  processCertificateImageMock.mockResolvedValue(makeProcessedPair("certifications"));
  processFeaturedImageMock.mockResolvedValue(makeFeaturedPair("blog"));
  processEducationDocumentImageMock.mockResolvedValue(makeProcessedPair("education"));
});

// ── POST Tests ───────────────────────────────────────────────────────────────

describe("POST /api/upload", () => {
  describe("rate limiting", () => {
    it("should return 429 when rate limit is exceeded", async () => {
      rateLimitMock.mockResolvedValueOnce({ success: false, remaining: 0, resetTime: 0 });
      const res = await POST(makeUpload({ file: {}, folder: "projects" }));
      expect(res.status).toBe(429);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("should pass the correct key + limit + window", async () => {
      await POST(makeUpload({ file: {}, folder: "projects" }));
      expect(rateLimitMock).toHaveBeenCalledWith("upload:127.0.0.1", 20, 60_000);
    });
  });

  describe("input validation", () => {
    it("should return 400 when file is missing", async () => {
      const req = new NextRequest("http://localhost/api/upload", {
        method: "POST",
        body: new FormData(),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("MISSING_FILE");
    });

    it("should return 400 when folder is missing", async () => {
      const res = await POST(makeUpload({ file: {} }));
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("INVALID_FOLDER");
    });

    it("should return 400 when folder is not in the allowlist", async () => {
      const res = await POST(makeUpload({ file: {}, folder: "malicious" }));
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("INVALID_FOLDER");
    });

    it("should return 400 when file exceeds 10MB", async () => {
      const res = await POST(makeUpload({ file: { size: 11 * 1024 * 1024 }, folder: "projects" }));
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("FILE_TOO_LARGE");
    });

    it("should return 400 for invalid MIME type on image folders", async () => {
      const res = await POST(makeUpload({ file: { type: "application/pdf" }, folder: "projects" }));
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("INVALID_FILE_TYPE");
    });
  });

  describe("resume folder", () => {
    it("should reject non-PDF files", async () => {
      const res = await POST(makeUpload({ file: { type: "image/png" }, folder: "resume" }));
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("INVALID_FILE_TYPE");
    });

    it("should upload PDF with fixed key resume/resume_latest.pdf", async () => {
      const res = await POST(
        makeUpload({ file: { type: "application/pdf", name: "cv.pdf" }, folder: "resume" })
      );
      expect(res.status).toBe(200);
      expect(uploadToS3Mock).toHaveBeenCalledWith(
        expect.any(Buffer),
        "resume/resume_latest.pdf",
        "application/pdf"
      );
      const body = (await res.json()) as { data: { key: string } };
      expect(body.data.key).toBe("resume/resume_latest.pdf");
    });
  });

  describe("education folder", () => {
    it("should return 400 when entityId is missing", async () => {
      const res = await POST(
        makeUpload({ file: { type: "application/pdf" }, folder: "education" })
      );
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("MISSING_ENTITY_ID");
    });

    it("should reject unsupported MIME types", async () => {
      const res = await POST(
        makeUpload({
          file: { type: "application/zip" },
          folder: "education",
          entityId: "edu1",
        })
      );
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("INVALID_FILE_TYPE");
    });

    it("should upload PDF directly without image processing", async () => {
      const res = await POST(
        makeUpload({
          file: { type: "application/pdf", name: "diploma.pdf" },
          folder: "education",
          entityId: "edu1",
        })
      );
      expect(res.status).toBe(200);
      expect(uploadToS3Mock).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.stringContaining("education/edu1/doc_"),
        "application/pdf"
      );
      expect(processEducationDocumentImageMock).not.toHaveBeenCalled();
    });

    it("should process images through processEducationDocumentImage", async () => {
      const res = await POST(
        makeUpload({
          file: { type: "image/jpeg" },
          folder: "education",
          entityId: "edu1",
        })
      );
      expect(res.status).toBe(200);
      expect(processEducationDocumentImageMock).toHaveBeenCalledWith(
        expect.any(Buffer),
        "edu1",
        "test-id-12ch"
      );
      expect(uploadToS3Mock).toHaveBeenCalledTimes(2);
    });
  });

  describe("profile folder", () => {
    it("should process through processProfileImage and return display + original", async () => {
      const res = await POST(makeUpload({ file: {}, folder: "profile" }));
      expect(res.status).toBe(200);
      expect(processProfileImageMock).toHaveBeenCalledWith(expect.any(Buffer), "test-id-12ch");
      const body = (await res.json()) as { data: { urls: Record<string, string> } };
      expect(body.data.urls).toHaveProperty("display");
      expect(body.data.urls).toHaveProperty("original");
    });
  });

  describe("logos folder", () => {
    it("should return 400 when entityId is missing", async () => {
      const res = await POST(makeUpload({ file: {}, folder: "logos" }));
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("MISSING_ENTITY_ID");
    });

    it("should process through processLogoImage", async () => {
      const res = await POST(makeUpload({ file: {}, folder: "logos", entityId: "comp1" }));
      expect(res.status).toBe(200);
      expect(processLogoImageMock).toHaveBeenCalledWith(
        expect.any(Buffer),
        "logos",
        "comp1",
        "test-id-12ch"
      );
    });
  });

  describe("certifications folder", () => {
    it("should return 400 when entityId is missing", async () => {
      const res = await POST(makeUpload({ file: {}, folder: "certifications" }));
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("MISSING_ENTITY_ID");
    });

    it("should use processCertificateImage when variant is certificate", async () => {
      const res = await POST(
        makeUpload({
          file: {},
          folder: "certifications",
          entityId: "cert1",
          variant: "certificate",
        })
      );
      expect(res.status).toBe(200);
      expect(processCertificateImageMock).toHaveBeenCalledWith(
        expect.any(Buffer),
        "cert1",
        "test-id-12ch"
      );
      expect(processLogoImageMock).not.toHaveBeenCalled();
    });

    it("should use processLogoImage when variant is not certificate", async () => {
      const res = await POST(makeUpload({ file: {}, folder: "certifications", entityId: "cert1" }));
      expect(res.status).toBe(200);
      expect(processLogoImageMock).toHaveBeenCalledWith(
        expect.any(Buffer),
        "certifications",
        "cert1",
        "test-id-12ch"
      );
      expect(processCertificateImageMock).not.toHaveBeenCalled();
    });
  });

  describe("blog folder", () => {
    it("should return 400 when entityId is missing", async () => {
      const res = await POST(makeUpload({ file: {}, folder: "blog" }));
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("MISSING_ENTITY_ID");
    });

    it("should process through processFeaturedImage and return featured + original", async () => {
      const res = await POST(makeUpload({ file: {}, folder: "blog", entityId: "post1" }));
      expect(res.status).toBe(200);
      expect(processFeaturedImageMock).toHaveBeenCalledWith(
        expect.any(Buffer),
        "post1",
        "test-id-12ch"
      );
      const body = (await res.json()) as { data: { urls: Record<string, string> } };
      expect(body.data.urls).toHaveProperty("featured");
      expect(body.data.urls).toHaveProperty("original");
    });
  });

  describe("projects folder", () => {
    it("should process through processImage and return 4 variant URLs", async () => {
      const res = await POST(makeUpload({ file: {}, folder: "projects", entityId: "proj1" }));
      expect(res.status).toBe(200);
      expect(processImageMock).toHaveBeenCalledWith(expect.any(Buffer), {
        folder: "projects",
        entityId: "proj1",
        fileId: "test-id-12ch",
      });
      expect(uploadToS3Mock).toHaveBeenCalledTimes(4);
      const body = (await res.json()) as { data: { urls: Record<string, string> } };
      expect(body.data.urls).toHaveProperty("thumbnail");
      expect(body.data.urls).toHaveProperty("medium");
      expect(body.data.urls).toHaveProperty("large");
      expect(body.data.urls).toHaveProperty("original");
    });
  });
});

// ── DELETE Tests ─────────────────────────────────────────────────────────────

describe("DELETE /api/upload", () => {
  it("should return 400 for invalid body", async () => {
    const res = await DELETE(makeDelete({}));
    expect(res.status).toBe(400);
  });

  it("should return 400 for key with disallowed prefix", async () => {
    const res = await DELETE(makeDelete({ key: "../etc/passwd" }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("INVALID_KEY");
  });

  it.each([
    "projects/img.webp",
    "blog/post1/feat.webp",
    "profile/headshot.webp",
    "logos/comp.webp",
    "certifications/badge.webp",
    "resume/resume_latest.pdf",
    "education/edu1/doc.pdf",
  ])("should accept valid prefix: %s", async (key) => {
    const res = await DELETE(makeDelete({ key }));
    expect(res.status).toBe(204);
    expect(deleteImageVariantsMock).toHaveBeenCalledWith(key);
  });
});
