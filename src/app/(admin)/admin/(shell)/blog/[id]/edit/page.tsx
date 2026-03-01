"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { BlogPostForm } from "@/components/admin/BlogPostForm";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "blog", id],
    queryFn: () => apiClient.getBlogPost(id),
  });

  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Blog", href: "/admin/blog" },
    { label: "Edit Post" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !(data as { data?: unknown } | undefined)?.data) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="text-2xl font-bold">Edit Post</h1>
        <div className="flex flex-col items-center gap-4 p-12 text-center bg-white rounded-lg border">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-gray-600">Failed to load blog post.</p>
          <Link href="/admin/blog">
            <Button variant="outline">Back to Blog Posts</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-2xl font-bold">Edit Post</h1>
      <BlogPostForm initialData={(data as { data: Parameters<typeof BlogPostForm>[0]["initialData"] }).data} />
    </div>
  );
}
