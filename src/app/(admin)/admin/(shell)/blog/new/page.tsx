"use client";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import dynamic from "next/dynamic";

const BlogPostForm = dynamic(
  () => import("@/components/admin/BlogPostForm").then((m) => m.BlogPostForm),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse rounded-md bg-gray-100" />,
  }
);

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
