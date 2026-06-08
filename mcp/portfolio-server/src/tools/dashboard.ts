import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiGet } from "../client.js";
import { ok, err } from "../types.js";

export function registerDashboardTools(server: McpServer): void {
  server.tool(
    "get-dashboard-stats",
    "Get portfolio admin dashboard statistics: entity counts, published/draft breakdowns, recent projects and posts, unread messages, expiring certifications, and content completeness.",
    {},
    async () => {
      try {
        const data = await apiGet("/api/admin/dashboard-stats");
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );
}
