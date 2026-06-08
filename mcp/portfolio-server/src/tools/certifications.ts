import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiDelete, apiGet, apiPost, apiPut } from "../client.js";
import { ok, err } from "../types.js";

const certificationInput = {
  name: z.string().min(1).max(200),
  issuer: z.string().min(1).max(200),
  dateEarned: z.string(),
  expirationDate: z.string().nullable().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().optional(),
  badgeImage: z.string().optional(),
  certificateImage: z.string().optional(),
  displayOrder: z.number().int().default(0),
  visible: z.boolean().default(true),
};

export function registerCertificationTools(server: McpServer): void {
  server.tool(
    "list-certifications",
    "List all certifications.",
    { visible: z.enum(["true", "false", "all"]).default("all") },
    async (input) => {
      try {
        const data = await apiGet("/api/certifications", { visible: input.visible });
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "create-certification",
    "Create a new certification entry.",
    certificationInput,
    async (input) => {
      try {
        const data = await apiPost("/api/certifications", input);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "update-certification",
    "Update a certification by ID. Only provided fields are changed.",
    {
      id: z.string(),
      ...Object.fromEntries(Object.entries(certificationInput).map(([k, v]) => [k, v.optional()])),
    },
    async ({ id, ...fields }) => {
      try {
        const data = await apiPut(`/api/certifications/${id}`, fields);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "delete-certification",
    "Delete a certification by ID.",
    { id: z.string() },
    async (input) => {
      try {
        await apiDelete(`/api/certifications/${input.id}`);
        return ok({ deleted: true, id: input.id });
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "reorder-certifications",
    "Reorder certifications by providing an ordered array of IDs.",
    { ids: z.array(z.string()).min(1) },
    async (input) => {
      try {
        const data = await apiPut("/api/certifications/reorder", { orderedIds: input.ids });
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );
}
