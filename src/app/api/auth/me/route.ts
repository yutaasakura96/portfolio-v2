import { verifyJwt } from "@/lib/aws/cognito";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return Response.json(
      { error: { message: "Not authenticated", code: "UNAUTHORIZED" } },
      { status: 401 }
    );
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
    return Response.json(
      { error: { message: "Invalid or expired token", code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }
}
