"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ImportExportToolbar } from "@/components/admin/ImportExportToolbar";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import type { Experience } from "@/lib/data/types";
import { entityConfigs } from "@/lib/import-export";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

function formatDateRange(startDate: Date | string, endDate: Date | string | null): string {
  const start = new Date(startDate);
  const startStr = start.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  if (!endDate) {
    return `${startStr} - Present`;
  }

  const end = new Date(endDate);
  const endStr = end.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return `${startStr} - ${endStr}`;
}

export function ExperienceManagerSection() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "experience"],
    queryFn: () =>
      apiClient.getExperience<Experience, { total: number }>({
        visible: "all",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "experience"] });
      toast.success("Experience deleted");
      setDeleteId(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to delete experience";
      toast.error(message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Experience</h2>
        <div className="flex items-center gap-2">
          <ImportExportToolbar
            entity="experience"
            entityLabel="Experience"
            entityConfig={entityConfigs.experience}
            queryKey={["admin", "experience"]}
          />
          <Link href="/admin/experience/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" /> New Experience
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg border border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Failed to load experience</p>
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <>
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Date Range
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Visible
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((exp) => (
                    <tr
                      key={exp.id}
                      className="border-b last:border-b-0 hover:bg-muted transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className="font-medium text-foreground">{exp.company}</span>
                          {exp.location && (
                            <p className="text-xs text-muted-foreground">{exp.location}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-foreground">{exp.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {formatDateRange(exp.startDate, exp.endDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {exp.visible ? (
                          <Badge>Visible</Badge>
                        ) : (
                          <Badge variant="secondary">Hidden</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/experience/${exp.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Edit ${exp.company} experience`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(exp.id)}
                            aria-label={`Delete ${exp.company} experience`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
                <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">No experience yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by adding your first work experience.
                </p>
                <Link href="/admin/experience/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" /> Add Experience
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Experience"
        description="Are you sure you want to delete this experience? This action cannot be undone."
        isLoading={deleteMutation.isPending}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
