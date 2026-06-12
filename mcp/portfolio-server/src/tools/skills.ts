import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiDelete, apiGet, apiPost, apiPut } from "../client.js";
import { ok, err } from "../types.js";

const skillFields = {
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  icon: z.string().max(100).optional(),
  iconUrl: z.string().optional(),
  proficiencyLevel: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .nullable()
    .optional(),
  displayOrder: z.number().int(),
  visible: z.boolean(),
};

const skillCreateInput = {
  ...skillFields,
  displayOrder: skillFields.displayOrder.default(0),
  visible: skillFields.visible.default(true),
};

export function registerSkillTools(server: McpServer): void {
  server.tool(
    "list-skills",
    "List all skills, optionally grouped by category.",
    {
      visible: z.enum(["true", "false", "all"]).default("all"),
      grouped: z.boolean().default(false),
    },
    async (input) => {
      try {
        const data = await apiGet("/api/skills", {
          visible: input.visible,
          grouped: input.grouped,
        });
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool("create-skill", "Create a new skill entry.", skillCreateInput, async (input) => {
    try {
      const data = await apiPost("/api/skills", input);
      return ok(data);
    } catch (e) {
      return err(e);
    }
  });

  server.tool(
    "update-skill",
    "Update a skill by ID. Only provided fields are changed.",
    {
      id: z.string(),
      ...Object.fromEntries(Object.entries(skillFields).map(([k, v]) => [k, v.optional()])),
    },
    async ({ id, ...fields }) => {
      try {
        const data = await apiPut(`/api/skills/${id}`, fields);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool("delete-skill", "Delete a skill by ID.", { id: z.string() }, async (input) => {
    try {
      await apiDelete(`/api/skills/${input.id}`);
      return ok({ deleted: true, id: input.id });
    } catch (e) {
      return err(e);
    }
  });

  server.tool(
    "reorder-skills",
    "Reorder skills by providing an ordered array of IDs.",
    { ids: z.array(z.string()).min(1) },
    async (input) => {
      try {
        const data = await apiPut("/api/skills/reorder", { orderedIds: input.ids });
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );
}
