import { exchangeCodeForTokens, verifyJwt } from "@/lib/aws/cognito";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Handle Cognito errors (e.g., user cancelled login)
  if (error) {
    return NextResponse.redirect(new URL(`/admin/login?error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login?error=no_code", request.url));
  }

  try {
    // Determine the redirect URI (must match what was sent to Cognito)
    const redirectUri = `${request.nextUrl.origin}/api/auth/callback`;

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Verify the ID token to extract user info
    await verifyJwt(tokens.id_token);

    // Create response with redirect to admin dashboard
    const response = NextResponse.redirect(new URL("/admin", request.url));

    // Set HTTP-only cookies
    const isProduction = process.env.NODE_ENV === "production";

    response.cookies.set("access_token", tokens.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: tokens.expires_in, // typically 3600 (1 hour)
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
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(new URL("/admin/login?error=auth_failed", request.url));
  }
}
