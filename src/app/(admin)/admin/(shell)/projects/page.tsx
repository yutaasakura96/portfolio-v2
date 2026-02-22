"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { Project } from "@/types/project";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

type ProjectsResponse = {
  data: Project[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export default function ProjectsListPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<ProjectsResponse>({
    queryKey: ["admin", "projects", page],
    queryFn: () =>
      apiClient.getProjects<Project, ProjectsResponse["meta"]>({
        status: "all",
        page: page.toString(),
        limit: "20",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
      toast.success("Project deleted");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link href="/admin/projects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> New Project
          </Button>
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Failed to load projects</p>
            <p className="text-sm text-red-500">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-lg border p-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded" />
                <div className="h-6 w-6 bg-gray-200 rounded" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-200 rounded" />
                  <div className="h-8 w-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Featured
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className="font-medium text-gray-900">{project.title}</span>
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {project.shortDescription}
                          </p>
                          <p className="text-xs text-gray-500">/{project.slug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={project.status === "PUBLISHED" ? "default" : "secondary"}>
                          {project.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {project.featured ? (
                          <span className="text-lg" aria-label="Featured">
                            ⭐
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/projects/${project.id}/edit`}>
                            <Button variant="ghost" size="sm" aria-label={`Edit ${project.title}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(project.id)}
                            aria-label={`Delete ${project.title}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.data.length === 0 && (
              <div className="p-12 text-center">
                <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get started by creating your first project.
                </p>
                <Link href="/admin/projects/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" /> Create Project
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * data.meta.limit + 1} to{" "}
                {Math.min(page * data.meta.limit, data.meta.total)} of {data.meta.total} projects
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(data.meta.totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === data.meta.totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return (
                        <span key={pageNum} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                  disabled={page === data.meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        isLoading={deleteMutation.isPending}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
