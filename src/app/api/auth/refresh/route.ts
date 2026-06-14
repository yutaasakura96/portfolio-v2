import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { refreshAccessToken } from "@/lib/aws/cognito";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const POST = withErrorHandler(async () => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    throw new ApiError("No refresh token", 401, ErrorCodes.UNAUTHORIZED);
  }

  const tokens = await refreshAccessToken(refreshToken);

  const response = new NextResponse(null, { status: 204 });
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set("access_token", tokens.access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: tokens.expires_in,
  });

  response.cookies.set("id_token", tokens.id_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: tokens.expires_in,
  });

  return response;
});
