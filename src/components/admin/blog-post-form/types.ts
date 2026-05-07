// Explicit form type — avoids Zod 4 coerce.date() input/output mismatch with
// react-hook-form. Shared by the orchestrator and subcomponents that read the
// form context via useFormContext<BlogPostFormValues>().
export type BlogPostFormValues = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  publishedAt: Date | null;
};

export type BlogPostInitialData = {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
};
