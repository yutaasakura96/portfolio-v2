"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Plus, Pencil, Trash2, Eye, EyeOff, Clock } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  readTime: number | null;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BlogListPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "DRAFT" | "PUBLISHED">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "blog", statusFilter],
    queryFn: () =>
      apiClient.getBlogPosts({ status: statusFilter, pageSize: "50" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteBlogPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
      toast.success("Post deleted");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete post");
    },
  });

  const posts = (data as { data: BlogPost[] } | undefined)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <Link href="/admin/blog/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> New Post
          </Button>
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {(["all", "PUBLISHED", "DRAFT"] as const).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status === "all" ? "All" : status === "PUBLISHED" ? "Published" : "Drafts"}
          </Button>
        ))}
      </div>

      {/* Posts List */}
      {isLoading ? (
        <TableSkeleton rows={3} />
      ) :posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">No blog posts yet.</p>
          <Link href="/admin/blog/new">
            <Button className="mt-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Create your first post
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border hover:border-gray-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/admin/blog/${post.id}/edit`}
                    className="font-medium text-gray-900 hover:text-blue-600 truncate"
                  >
                    {post.title}
                  </Link>
                  <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                    {post.status === "PUBLISHED" ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" /> Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" /> Draft
                      </>
                    )}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  {post.publishedAt && (
                    <span>{format(new Date(post.publishedAt), "MMM d, yyyy")}</span>
                  )}
                  {post.readTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {post.readTime} min read
                    </span>
                  )}
                  {post.tags.length > 0 && (
                    <span className="text-gray-400">
                      {post.tags.slice(0, 3).join(", ")}
                      {post.tags.length > 3 && ` +${post.tags.length - 3}`}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {post.status === "PUBLISHED" && (
                  <Link href={`/blog/${post.slug}`} target="_blank">
                    <Button variant="ghost" size="icon" title="View published post">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link href={`/admin/blog/${post.id}/edit`}>
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => setDeleteId(post.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Blog Post"
        description="This will permanently delete this blog post and all associated images. This action cannot be undone."
        confirmText="Delete Post"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
