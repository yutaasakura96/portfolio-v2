import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaClient";
import { contactMessageSchema } from "@/lib/validations/contact";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendContactNotification } from "@/lib/aws/ses";
import { withErrorHandler, ApiError, ErrorCodes } from "@/lib/errors";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();

  // 1. Honeypot check — silently succeed to fool bots
  if (body.honeypot && body.honeypot.length > 0) {
    return NextResponse.json(
      { data: { success: true, message: "Your message has been sent successfully." } },
      { status: 200 }
    );
  }

  // 2. Rate limiting — 5 requests per 15 minutes per IP
  const ip = getClientIp(request);
  const result = rateLimit(`contact:${ip}`, 5, 15 * 60 * 1000);
  if (!result.success) {
    throw new ApiError(
      "Too many messages sent. Please try again in a few minutes.",
      429,
      ErrorCodes.RATE_LIMIT_EXCEEDED
    );
  }

  // 3. Zod validation
  const parsed = contactMessageSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      "Validation failed",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten().fieldErrors
    );
  }

  const { name, email, subject, message } = parsed.data;

  // 4. Save to database
  const contactMessage = await prisma.contactMessage.create({
    data: {
      name,
      email,
      subject: subject || "",
      message,
    },
  });

  // 5. Send email notification (fire-and-forget — do not fail the request if email fails)
  sendContactNotification({
    name,
    email,
    subject: subject || "",
    message,
    messageId: contactMessage.id,
  }).catch((error) => {
    console.error("Failed to send contact notification email:", error);
  });

  // 6. Return success
  return NextResponse.json(
    { data: { success: true, message: "Your message has been sent successfully." } },
    { status: 200 }
  );
});
