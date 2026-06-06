import { prisma } from "@/lib/prismaClient";
import { verifyJwt } from "@/lib/aws/cognito";
import { ApiError, ErrorCodes } from "@/lib/errors";
import { cookies } from "next/headers";
import { createHash } from "crypto";

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

/**
 * Verify an API key from the Authorization: Bearer header.
 * Hashes the incoming key (SHA-256) and looks it up in the database.
 * Updates lastUsedAt fire-and-forget on success.
 * Used by non-browser clients (MCP server) that cannot use cookies.
 */
export async function requireApiKey(request: Request): Promise<AuthUser> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError("API key required", 401, ErrorCodes.UNAUTHORIZED);
  }
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) {
    throw new ApiError("API key required", 401, ErrorCodes.UNAUTHORIZED);
  }
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });
  if (!apiKey) {
    throw new ApiError("Invalid API key", 401, ErrorCodes.UNAUTHORIZED);
  }
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});
  return { email: "api-key", sub: `apikey:${apiKey.id}` };
}

/**
 * Try cookie auth first (browser sessions), fall back to API key auth
 * (MCP server and programmatic clients). Throws 401 if both fail.
 * Use in place of requireAuth() on routes the MCP server needs to access.
 */
export async function requireAuthOrApiKey(request: Request): Promise<AuthUser> {
  const cookieUser = await optionalAuth();
  if (cookieUser) return cookieUser;
  return requireApiKey(request);
}
