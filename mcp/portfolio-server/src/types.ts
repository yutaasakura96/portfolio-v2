export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    warning?: string;
  };
}

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

import { ENV_TAG } from "./client.js";

export function ok(data: unknown): ToolResult {
  return {
    content: [{ type: "text", text: `${ENV_TAG}\n${JSON.stringify(data, null, 2)}` }],
  };
}

export function err(error: unknown): ToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text", text: `${ENV_TAG}\nError: ${message}` }],
    isError: true,
  };
}
