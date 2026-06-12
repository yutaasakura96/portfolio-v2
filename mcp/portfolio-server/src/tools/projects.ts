import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiDelete, apiGet, apiPost, apiPut } from "../client.js";
import { ok, err } from "../types.js";

const projectFields = {
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  shortDescription: z.string().min(1).max(300),
  description: z.string().min(1),
  problem: z.string().optional(),
  solution: z.string().optional(),
  role: z.string().max(200).optional(),
  techTags: z.array(z.string()).min(1),
  thumbnailImage: z.string().optional(),
  liveUrl: z.string().optional(),
  repoUrl: z.string().optional(),
  featured: z.boolean(),
  displayOrder: z.number().int(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
};

const projectCreateInput = {
  ...projectFields,
  featured: projectFields.featured.default(false),
  displayOrder: projectFields.displayOrder.default(0),
  status: projectFields.status.default("DRAFT"),
};

export function registerProjectTools(server: McpServer): void {
  server.tool(
    "list-projects",
    "List portfolio projects. Filter by status (PUBLISHED, DRAFT, or all), featured flag, or search term.",
    {
      status: z.enum(["PUBLISHED", "DRAFT", "all"]).default("all"),
      featured: z.boolean().optional(),
      search: z.string().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    },
    async (input) => {
      try {
        const data = await apiGet("/api/projects", {
          status: input.status,
          featured: input.featured,
          search: input.search,
          page: input.page,
          limit: input.limit,
        });
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool("get-project", "Get a single project by ID.", { id: z.string() }, async (input) => {
    try {
      const data = await apiGet(`/api/projects/${input.id}`);
      return ok(data);
    } catch (e) {
      return err(e);
    }
  });

  server.tool(
    "create-project",
    "Create a new portfolio project. Slug must be unique lowercase kebab-case. Status defaults to DRAFT.",
    projectCreateInput,
    async (input) => {
      try {
        const data = await apiPost("/api/projects", input);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "update-project",
    "Update an existing project by ID. Only provided fields are changed.",
    {
      id: z.string(),
      ...Object.fromEntries(Object.entries(projectFields).map(([k, v]) => [k, v.optional()])),
    },
    async ({ id, ...fields }) => {
      try {
        const data = await apiPut(`/api/projects/${id}`, fields);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "delete-project",
    "Permanently delete a project by ID.",
    { id: z.string() },
    async (input) => {
      try {
        await apiDelete(`/api/projects/${input.id}`);
        return ok({ deleted: true, id: input.id });
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "reorder-projects",
    "Reorder projects by providing an ordered array of project IDs. The array index sets displayOrder.",
    { ids: z.array(z.string()).min(1) },
    async (input) => {
      try {
        const data = await apiPut("/api/projects/reorder", { orderedIds: input.ids });
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );
}
