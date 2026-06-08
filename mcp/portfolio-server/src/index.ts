import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerExperienceTools } from "./tools/experience.js";
import { registerEducationTools } from "./tools/education.js";
import { registerSkillTools } from "./tools/skills.js";
import { registerCertificationTools } from "./tools/certifications.js";
import { registerMessageTools } from "./tools/messages.js";
import { registerBlogTools } from "./tools/blog.js";
import { registerContentTools } from "./tools/content.js";
import { registerDashboardTools } from "./tools/dashboard.js";

const instructions = [
  "Portfolio content management server. 43 tools for full CRUD on projects, experience, education, skills, certifications, and blog posts, plus read/update for site content (hero, about, settings) and a dashboard overview.",
  "",
  "Auth: all tools require a valid API key (Bearer token). The server proxies requests through the Next.js API layer — it never accesses the database directly.",
  "",
  "Security: messages can be listed, read, marked-read, archived, and bulk-updated, but there is intentionally NO delete tool for messages. All other entities support full CRUD including delete.",
  "",
  "Tool naming: `verb-entity` pattern (list-projects, create-skill, get-dashboard-stats). Use `list-*` to discover IDs before `get-*`, `update-*`, or `delete-*`. Reorder tools accept an ordered array of all entity IDs.",
  "",
  "Defaults: `status` defaults to DRAFT for projects and blog posts. `visible` defaults to true for experience, education, skills, and certifications.",
  "",
  "Best practices: call `get-dashboard-stats` first for a full portfolio overview. Use `list-*` before mutations to confirm IDs exist. Pagination is available on list tools via `page` and `limit` params.",
].join("\n");

const server = new McpServer({ name: "portfolio", version: "1.0.0" }, { instructions });

registerProjectTools(server);
registerExperienceTools(server);
registerEducationTools(server);
registerSkillTools(server);
registerCertificationTools(server);
registerMessageTools(server);
registerBlogTools(server);
registerContentTools(server);
registerDashboardTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
