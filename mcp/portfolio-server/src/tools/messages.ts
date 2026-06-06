import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPut } from "../client.js";
import { ok, err } from "../types.js";

export function registerMessageTools(server: McpServer): void {
  server.tool(
    "list-messages",
    "List contact messages with optional filtering. No delete tool is available — use archive-message to hide messages.",
    {
      read: z.enum(["true", "false", "all"]).default("all"),
      archived: z.boolean().optional(),
      sort: z.enum(["newest", "oldest"]).default("newest"),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(20),
    },
    async (input) => {
      try {
        const data = await apiGet("/api/messages", {
          read: input.read,
          archived: input.archived,
          sort: input.sort,
          page: input.page,
          limit: input.limit,
        });
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "get-message",
    "Get a single contact message by ID. Auto-marks it as read.",
    { id: z.string() },
    async (input) => {
      try {
        const data = await apiGet(`/api/messages/${input.id}`);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "mark-message-read",
    "Mark a contact message as read.",
    { id: z.string() },
    async (input) => {
      try {
        const data = await apiPut(`/api/messages/${input.id}`, { read: true });
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "archive-message",
    "Archive a contact message so it no longer appears in the default inbox.",
    { id: z.string() },
    async (input) => {
      try {
        const data = await apiPut(`/api/messages/${input.id}`, { archived: true });
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "bulk-update-messages",
    "Bulk mark multiple messages as read and/or archived.",
    {
      ids: z.array(z.string()).min(1),
      read: z.boolean().optional(),
      archived: z.boolean().optional(),
    },
    async (input) => {
      try {
        const { ids, ...update } = input;
        const data = await apiPut("/api/messages/bulk", { ids, update });
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );
}
