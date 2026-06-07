import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";

const ignoredErrorEventMessage = "[object ErrorEvent]";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

function isOpaqueErrorEvent(error: unknown): boolean {
  if (
    String(error) === ignoredErrorEventMessage ||
    String(error) === `Error: ${ignoredErrorEventMessage}`
  ) {
    return true;
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  if (Object.prototype.toString.call(error) === ignoredErrorEventMessage) {
    return true;
  }

  if ("message" in error && String(error.message) === ignoredErrorEventMessage) {
    return true;
  }

  return false;
}

function shouldIgnoreRequestError(
  error: unknown,
  request: Parameters<Instrumentation.onRequestError>[1],
  errorContext: Parameters<Instrumentation.onRequestError>[2]
): boolean {
  return (
    request.method === "GET" &&
    errorContext.routerKind === "App Router" &&
    errorContext.routeType === "render" &&
    errorContext.routePath === "/projects/[slug]" &&
    isOpaqueErrorEvent(error)
  );
}

export const onRequestError: Instrumentation.onRequestError = (error, request, errorContext) => {
  if (shouldIgnoreRequestError(error, request, errorContext)) {
    return;
  }

  Sentry.captureRequestError(error, request, errorContext);
};
