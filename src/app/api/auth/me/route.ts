import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { verifyJwt } from "@/lib/aws/cognito";
import { cookies } from "next/headers";

export const GET = withErrorHandler(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
  }

  try {
    const payload = await verifyJwt(token);
    return Response.json({
      data: {
        email: payload.email,
        sub: payload.sub,
      },
    });
  } catch {
    throw new ApiError("Invalid or expired token", 401, ErrorCodes.UNAUTHORIZED);
  }
});
