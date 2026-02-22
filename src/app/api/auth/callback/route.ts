import { exchangeCodeForTokens, verifyJwt } from "@/lib/aws/cognito";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Determine the correct public-facing URL using forwarded headers
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
  const baseUrl = `${protocol}://${host}`;

  console.log("Request debug:", {
    url: request.url,
    origin: request.nextUrl.origin,
    host: request.headers.get("host"),
    xForwardedHost: request.headers.get("x-forwarded-host"),
    xForwardedProto: request.headers.get("x-forwarded-proto"),
    computedBaseUrl: baseUrl,
  });

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Handle Cognito errors (e.g., user cancelled login)
  if (error) {
    return NextResponse.redirect(new URL(`/admin/login?error=${error}`, baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login?error=no_code", baseUrl));
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/callback`;

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Verify the ID token to extract user info
    await verifyJwt(tokens.id_token);

    // Create response with redirect to admin dashboard
    const response = NextResponse.redirect(new URL("/admin", baseUrl));

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
    return NextResponse.redirect(new URL("/admin/login?error=auth_failed", baseUrl));
  }
}
