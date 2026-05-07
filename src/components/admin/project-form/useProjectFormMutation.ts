"use client";

import { apiClient } from "@/lib/api-client";
import type { ProjectCreateInput } from "@/lib/validations/project";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseProjectFormMutationOptions {
  projectId?: string;
}

/**
 * Wraps the create/update project mutation with consistent toast + invalidation
 * + redirect behavior. Used by the ProjectForm orchestrator.
 */
export function useProjectFormMutation({ projectId }: UseProjectFormMutationOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!projectId;

  return useMutation({
    mutationFn: (values: ProjectCreateInput) =>
      isEditing ? apiClient.updateProject(projectId, values) : apiClient.createProject(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ["admin", "project", projectId] });
      }
      toast.success(isEditing ? "Project updated" : "Project created");
      router.push("/admin/projects");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to save project";
      toast.error(message);
    },
  });
}
