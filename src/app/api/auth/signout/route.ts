import { withErrorHandler } from "@/lib/errors";
import { revokeToken } from "@/lib/aws/cognito";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const POST = withErrorHandler(async () => {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    if (refreshToken) {
      await revokeToken(refreshToken);
    }
  } catch {
    // Non-fatal: proceed with cookie clearing even if revocation fails
  }

  const response = new NextResponse(null, { status: 204 });
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("id_token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 0,
  });

  return response;
});
