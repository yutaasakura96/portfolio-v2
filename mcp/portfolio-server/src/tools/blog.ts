import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiDelete, apiGet, apiPost, apiPut } from "../client.js";
import { ok, err } from "../types.js";

const blogPostFields = {
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  featuredImage: z.string().optional(),
  tags: z.array(z.string()),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: z.string().optional(),
  readTime: z.number().int().optional(),
};

const blogPostCreateInput = {
  ...blogPostFields,
  tags: blogPostFields.tags.default([]),
  status: blogPostFields.status.default("DRAFT"),
};

export function registerBlogTools(server: McpServer): void {
  server.tool(
    "list-blog-posts",
    "List blog posts. Filter by status (PUBLISHED, DRAFT, or all) or search term.",
    {
      status: z.enum(["PUBLISHED", "DRAFT", "all"]).default("all"),
      search: z.string().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    },
    async (input) => {
      try {
        const data = await apiGet("/api/blog", {
          status: input.status,
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

  server.tool(
    "get-blog-post",
    "Get a single blog post by ID.",
    { id: z.string() },
    async (input) => {
      try {
        const data = await apiGet(`/api/blog/${input.id}`);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "create-blog-post",
    "Create a new blog post. Status defaults to DRAFT. Use Markdown for content. Slug must be unique lowercase kebab-case.",
    blogPostCreateInput,
    async (input) => {
      try {
        const data = await apiPost("/api/blog", input);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "update-blog-post",
    "Update a blog post by ID. Only provided fields are changed.",
    {
      id: z.string(),
      ...Object.fromEntries(Object.entries(blogPostFields).map(([k, v]) => [k, v.optional()])),
    },
    async ({ id, ...fields }) => {
      try {
        const data = await apiPut(`/api/blog/${id}`, fields);
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "delete-blog-post",
    "Permanently delete a blog post by ID.",
    { id: z.string() },
    async (input) => {
      try {
        await apiDelete(`/api/blog/${input.id}`);
        return ok({ deleted: true, id: input.id });
      } catch (e) {
        return err(e);
      }
    }
  );
}
