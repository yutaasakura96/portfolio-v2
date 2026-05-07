// Re-export shim — the implementation now lives in ./blog-post-form/ split
// into orchestrator + meta fields + markdown editor + cover image + tag input
// + mutation hook. Consumers continue to import from
// "@/components/admin/BlogPostForm".
export { BlogPostForm } from "./blog-post-form/BlogPostForm";
