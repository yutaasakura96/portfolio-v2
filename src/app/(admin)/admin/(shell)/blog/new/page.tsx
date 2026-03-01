"use client";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { BlogPostForm } from "@/components/admin/BlogPostForm";

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Blog", href: "/admin/blog" },
          { label: "New Post" },
        ]}
      />
      <h1 className="text-2xl font-bold">New Blog Post</h1>
      <BlogPostForm />
    </div>
  );
}
