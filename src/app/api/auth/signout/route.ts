import { revokeToken } from "@/lib/aws/cognito";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  // Revoke the refresh token server-side so it cannot be reused after sign-out
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    if (refreshToken) {
      await revokeToken(refreshToken);
    }
  } catch {
    // Non-fatal: proceed with cookie clearing even if revocation fails
  }

  const response = NextResponse.json({ data: { success: true } });

  // Clear all auth cookies
  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("id_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 0,
  });

  return response;
}
