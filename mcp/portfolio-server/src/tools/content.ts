import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPut } from "../client.js";
import { ok, err } from "../types.js";

export function registerContentTools(server: McpServer): void {
  // ── About ──────────────────────────────────────────────────────────────────

  server.tool("get-about", "Get the About page content.", {}, async () => {
    try {
      const data = await apiGet("/api/about");
      return ok(data);
    } catch (e) {
      return err(e);
    }
  });

  server.tool(
    "update-about",
    "Update the About page content. All fields are optional.",
    {
      heading: z.string().max(200).optional(),
      subheading: z.string().max(500).optional(),
      profileName: z.string().max(100).optional(),
      profileTitle: z.string().max(150).optional(),
      profileCompany: z.string().max(150).optional(),
      profileImageUrl: z.string().optional(),
      introHeadline: z.string().max(200).optional(),
      introBio: z.string().optional(),
    },
    async (input) => {
      try {
        const data = await apiPut("/api/about", input);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── Hero ───────────────────────────────────────────────────────────────────

  server.tool(
    "get-hero",
    "Get the Hero section content (headline, bio, CTA buttons).",
    {},
    async () => {
      try {
        const data = await apiGet("/api/hero");
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "update-hero",
    "Update the Hero section content. All fields are optional.",
    {
      headline: z.string().max(200).optional(),
      subheadline: z.string().max(300).optional(),
      bio: z.string().optional(),
      resumeUrl: z.string().optional(),
    },
    async (input) => {
      try {
        const data = await apiPut("/api/hero", input);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── Site Settings ──────────────────────────────────────────────────────────

  server.tool(
    "get-settings",
    "Get site settings (name, description, social links, contact email).",
    {},
    async () => {
      try {
        const data = await apiGet("/api/settings");
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "update-settings",
    "Update site settings. All fields are optional.",
    {
      siteName: z.string().max(200).optional(),
      siteDescription: z.string().max(500).optional(),
      email: z.string().email().optional(),
      googleAnalyticsId: z.string().optional(),
      socialLinks: z
        .object({
          github: z.string().optional(),
          linkedin: z.string().optional(),
          twitter: z.string().optional(),
          youtube: z.string().optional(),
          website: z.string().optional(),
        })
        .optional(),
    },
    async (input) => {
      try {
        const data = await apiPut("/api/settings", input);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );
}
