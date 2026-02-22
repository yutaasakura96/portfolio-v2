"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SkillFormDialog } from "@/components/admin/SkillFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { Skill, SkillsGroupedResponse } from "@/types/skill";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SkillsManagerPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "skills"],
    queryFn: async () => {
      const response = await apiClient.getSkills<Skill, { total: number }>({
        visible: "all",
        grouped: "true",
      });
      return response as unknown as SkillsGroupedResponse;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "skills"] });
      toast.success("Skill deleted");
      setDeleteId(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to delete skill";
      toast.error(message);
    },
  });

  const groupedSkills = (data?.data ?? {}) as Record<string, Skill[]>;
  const hasSkills = Object.keys(groupedSkills).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Skills</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Skill
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Failed to load skills</p>
            <p className="text-sm text-red-500">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="bg-white rounded-lg border p-4">
                <div className="space-y-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-5 w-24 bg-gray-200 rounded" />
                        <div className="h-5 w-20 bg-gray-200 rounded" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 rounded" />
                        <div className="h-8 w-8 bg-gray-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : hasSkills ? (
        <>
          {Object.entries(groupedSkills).map(([category, skills]) => (
            <div key={category} className="space-y-2">
              <h2 className="text-lg font-semibold">{category}</h2>
              <div className="bg-white rounded-lg border divide-y">
                {skills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      {skill.icon && (
                        <span className="text-xl" aria-hidden="true">
                          {skill.icon}
                        </span>
                      )}
                      <span className="font-medium">{skill.name}</span>
                      {skill.proficiencyLevel && (
                        <Badge variant="outline">{skill.proficiencyLevel}</Badge>
                      )}
                      {!skill.visible && <Badge variant="secondary">Hidden</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSkill(skill)}
                        aria-label={`Edit ${skill.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(skill.id)}
                        aria-label={`Delete ${skill.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="bg-white rounded-lg border p-12 text-center">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No skills yet</h3>
          <p className="text-sm text-gray-600 mb-4">Get started by adding your first skill.</p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Skill
          </Button>
        </div>
      )}

      <SkillFormDialog
        open={isCreateOpen || !!editingSkill}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingSkill(null);
          }
        }}
        initialData={editingSkill}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Skill"
        description="Are you sure you want to delete this skill? This action cannot be undone."
        isLoading={deleteMutation.isPending}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
