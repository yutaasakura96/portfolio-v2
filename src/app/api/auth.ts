import { verifyJwt } from "@/lib/aws/cognito";
import { ApiError, ErrorCodes } from "@/lib/errors";
import { cookies } from "next/headers";

export interface AuthUser {
  email: string;
  sub: string;
}

/**
 * Verify the session cookie and return the user, or throw 401.
 * Used in API routes that require authentication.
 */
export async function requireAuth(): Promise<AuthUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
  }

  try {
    const payload = await verifyJwt(token);
    return {
      email: payload.email as string,
      sub: payload.sub as string,
    };
  } catch {
    throw new ApiError("Invalid or expired token", 401, ErrorCodes.UNAUTHORIZED);
  }
}

/**
 * Optional auth check — returns user or null. Does NOT throw.
 * Used in endpoints that behave differently for authenticated vs public requests.
 */
export async function optionalAuth(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;
    const payload = await verifyJwt(token);
    return { email: payload.email as string, sub: payload.sub as string };
  } catch {
    return null;
  }
}
