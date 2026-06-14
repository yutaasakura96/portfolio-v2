import { withErrorHandler } from "@/lib/errors";
import { exchangeCodeForTokens, verifyJwt } from "@/lib/aws/cognito";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
  const baseUrl = `${protocol}://${host}`;

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/admin/login?error=${error}`, baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login?error=no_code", baseUrl));
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    await verifyJwt(tokens.id_token);

    const response = NextResponse.redirect(new URL("/admin", baseUrl));
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

    response.cookies.set("refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/admin/login?error=auth_failed", baseUrl));
  }
});
