"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { Education, EducationListResponse } from "@/types/education";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

function formatDateRange(
  startDate: Date | string | null,
  endDate: Date | string | null
): string {
  if (!startDate && !endDate) return "No dates specified";
  
  const startStr = startDate
    ? new Date(startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";
  const endStr = endDate
    ? new Date(endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Expected";
  
  return `${startStr} - ${endStr}`;
}

export default function EducationListPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "education"],
    queryFn: async () => {
      const response = await apiClient.getEducation<Education, { total: number }>({
        visible: "all",
      });
      return response as unknown as EducationListResponse;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteEducation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "education"] });
      toast.success("Education deleted");
      setDeleteId(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to delete education";
      toast.error(message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Education</h1>
        <Link href="/admin/education/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> New Education
          </Button>
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Failed to load education</p>
            <p className="text-sm text-red-500">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <>
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Institution
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Degree
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Field
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Date Range
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Visible
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((edu) => (
                    <tr
                      key={edu.id}
                      className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{edu.institution}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-900">{edu.degree}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-900">{edu.field}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {formatDateRange(edu.startDate, edu.endDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {edu.visible ? (
                          <Badge>Visible</Badge>
                        ) : (
                          <Badge variant="secondary">Hidden</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/education/${edu.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Edit ${edu.institution} education`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(edu.id)}
                            aria-label={`Delete ${edu.institution} education`}
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
                <h3 className="text-lg font-medium text-gray-900 mb-1">No education yet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get started by adding your educational background.
                </p>
                <Link href="/admin/education/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" /> Add Education
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
        title="Delete Education"
        description="Are you sure you want to delete this education entry? This action cannot be undone."
        isLoading={deleteMutation.isPending}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
