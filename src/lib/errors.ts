export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  UPLOAD_ERROR: "UPLOAD_ERROR",
  EMAIL_ERROR: "EMAIL_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
  }
}

/**
 * Wraps an API route handler with consistent error handling.
 */
export function withErrorHandler<TContext = unknown>(
  handler: (request: Request, context?: TContext) => Promise<Response>
) {
  return async (request: Request, context?: TContext): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return Response.json(
          {
            error: {
              message: error.message,
              code: error.code,
              ...(error.details ? { details: error.details } : {}),
            },
          },
          { status: error.statusCode }
        );
      }

      console.error("Unhandled API error:", error);
      return Response.json(
        {
          error: {
            message: "Internal server error",
            code: ErrorCodes.INTERNAL_ERROR,
          },
        },
        { status: 500 }
      );
    }
  };
}
