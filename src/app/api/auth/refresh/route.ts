import { refreshAccessToken } from "@/lib/aws/cognito";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return Response.json(
      { error: { message: "No refresh token", code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  try {
    const tokens = await refreshAccessToken(refreshToken);

    const response = NextResponse.json({ data: { success: true } });
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
  } catch {
    return Response.json(
      { error: { message: "Token refresh failed", code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }
}
