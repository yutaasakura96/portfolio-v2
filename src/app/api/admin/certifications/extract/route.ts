import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";
import { z } from "zod/v4";

const extractRequestSchema = z.object({
  imageUrl: z.string().url(),
});

interface ExtractedCertification {
  name?: string;
  issuer?: string;
  dateEarned?: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

const EXTRACTION_PROMPT = `Extract certification details from this image. Return ONLY valid JSON with these fields (omit any you cannot determine):
{
  "name": "certification name",
  "issuer": "issuing organization",
  "dateEarned": "YYYY-MM-DD",
  "expirationDate": "YYYY-MM-DD",
  "credentialId": "credential ID string",
  "credentialUrl": "verification URL"
}
No markdown fences. No explanation. JSON only.`;

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const ip = getClientIp(request);
  const result = await rateLimit(`cert-extract:${ip}`, 10, 60 * 1000);
  if (!result.success) {
    throw new ApiError("Too many extraction requests", 429, ErrorCodes.RATE_LIMIT_EXCEEDED);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ApiError("Certificate extraction is not configured", 503, ErrorCodes.INTERNAL_ERROR);
  }

  const body = await request.json();
  const parsed = extractRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: parsed.data.imageUrl },
            },
            { type: "text", text: EXTRACTION_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Anthropic API error:", response.status, errorBody);
    throw new ApiError("Failed to extract certification details", 502, ErrorCodes.INTERNAL_ERROR);
  }

  const anthropicResponse = await response.json();
  const textContent = anthropicResponse.content?.find(
    (block: { type: string }) => block.type === "text"
  );

  if (!textContent?.text) {
    throw new ApiError("No extraction result returned", 502, ErrorCodes.INTERNAL_ERROR);
  }

  let extracted: ExtractedCertification;
  try {
    const raw = textContent.text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    extracted = JSON.parse(raw);
  } catch {
    console.error("Failed to parse extraction result:", textContent.text);
    throw new ApiError("Could not parse extraction result", 502, ErrorCodes.INTERNAL_ERROR);
  }

  return Response.json({ data: extracted });
});
