"use client";

import { apiClient } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { BlogPostFormValues } from "./types";

interface UseBlogPostFormMutationOptions {
  postId?: string;
}

/**
 * Wraps the create/update blog post mutation with consistent toast +
 * invalidation + redirect behavior. Used by the BlogPostForm orchestrator.
 */
export function useBlogPostFormMutation({ postId }: UseBlogPostFormMutationOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!postId;

  return useMutation({
    mutationFn: async (data: BlogPostFormValues) => {
      const payload = data as Record<string, unknown>;
      if (isEditing) {
        return apiClient.updateBlogPost(postId, payload);
      }
      return apiClient.createBlogPost(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
      toast.success(isEditing ? "Post updated" : "Post created");
      router.push("/admin/blog");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to save post";
      toast.error(message);
    },
  });
}
