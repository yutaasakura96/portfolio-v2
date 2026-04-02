import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const COGNITO_REGION = process.env.COGNITO_REGION!;
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;

const COGNITO_ISSUER = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;
const COGNITO_JWKS_URI = `${COGNITO_ISSUER}/.well-known/jwks.json`;

// Lazily initialized so env vars are read at runtime, not module load time
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(COGNITO_JWKS_URI));
  }
  return jwks;
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getJwks(), { issuer: COGNITO_ISSUER });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth routes through without validation
  if (pathname === "/admin/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Protect all admin routes with JWT validation
  if (pathname.startsWith("/admin")) {
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken || !(await verifyToken(accessToken))) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
