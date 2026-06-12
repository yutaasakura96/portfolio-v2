import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiDelete, apiGet, apiPost, apiPut } from "../client.js";
import { ok, err } from "../types.js";

const educationFields = {
  institution: z.string().min(1).max(200),
  degree: z.string().min(1).max(200),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  description: z.string().optional(),
  achievements: z.array(z.string()),
  logoUrl: z.string().optional(),
  institutionUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  displayOrder: z.number().int(),
  visible: z.boolean(),
};

const educationCreateInput = {
  ...educationFields,
  achievements: educationFields.achievements.default([]),
  displayOrder: educationFields.displayOrder.default(0),
  visible: educationFields.visible.default(true),
};

export function registerEducationTools(server: McpServer): void {
  server.tool(
    "list-education",
    "List all education entries.",
    { visible: z.enum(["true", "false", "all"]).default("all") },
    async (input) => {
      try {
        const data = await apiGet("/api/education", { visible: input.visible });
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "create-education",
    "Create a new education entry.",
    educationCreateInput,
    async (input) => {
      try {
        const data = await apiPost("/api/education", input);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "update-education",
    "Update an education entry by ID. Only provided fields are changed.",
    {
      id: z.string(),
      ...Object.fromEntries(Object.entries(educationFields).map(([k, v]) => [k, v.optional()])),
    },
    async ({ id, ...fields }) => {
      try {
        const data = await apiPut(`/api/education/${id}`, fields);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "delete-education",
    "Delete an education entry by ID.",
    { id: z.string() },
    async (input) => {
      try {
        await apiDelete(`/api/education/${input.id}`);
        return ok({ deleted: true, id: input.id });
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "reorder-education",
    "Reorder education entries by providing an ordered array of IDs.",
    { ids: z.array(z.string()).min(1) },
    async (input) => {
      try {
        const data = await apiPut("/api/education/reorder", { orderedIds: input.ids });
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );
}
