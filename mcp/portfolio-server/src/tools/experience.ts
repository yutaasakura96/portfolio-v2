import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiDelete, apiGet, apiPost, apiPut } from "../client.js";
import { ok, err } from "../types.js";

const experienceFields = {
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  description: z.string().min(1),
  highlights: z.array(z.string()),
  techTags: z.array(z.string()),
  logoUrl: z.string().optional(),
  companyUrl: z.string().optional(),
  displayOrder: z.number().int(),
  visible: z.boolean(),
};

const experienceCreateInput = {
  ...experienceFields,
  highlights: experienceFields.highlights.default([]),
  techTags: experienceFields.techTags.default([]),
  displayOrder: experienceFields.displayOrder.default(0),
  visible: experienceFields.visible.default(true),
};

export function registerExperienceTools(server: McpServer): void {
  server.tool(
    "list-experience",
    "List all work experience entries.",
    { visible: z.enum(["true", "false", "all"]).default("all") },
    async (input) => {
      try {
        const data = await apiGet("/api/experience", { visible: input.visible });
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "create-experience",
    "Create a new work experience entry.",
    experienceCreateInput,
    async (input) => {
      try {
        const data = await apiPost("/api/experience", input);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "update-experience",
    "Update a work experience entry by ID. Only provided fields are changed.",
    {
      id: z.string(),
      ...Object.fromEntries(Object.entries(experienceFields).map(([k, v]) => [k, v.optional()])),
    },
    async ({ id, ...fields }) => {
      try {
        const data = await apiPut(`/api/experience/${id}`, fields);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "delete-experience",
    "Delete a work experience entry by ID.",
    { id: z.string() },
    async (input) => {
      try {
        await apiDelete(`/api/experience/${input.id}`);
        return ok({ deleted: true, id: input.id });
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "reorder-experience",
    "Reorder experience entries by providing an ordered array of IDs.",
    { ids: z.array(z.string()).min(1) },
    async (input) => {
      try {
        const data = await apiPut("/api/experience/reorder", { orderedIds: input.ids });
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );
}
