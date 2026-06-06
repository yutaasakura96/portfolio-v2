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

const server = new McpServer({
  name: "portfolio",
  version: "1.0.0",
});

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
