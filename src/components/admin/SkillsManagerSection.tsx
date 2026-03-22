"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SkillFormDialog } from "@/components/admin/SkillFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { Skill, SkillsGroupedResponse } from "@/types/skill";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type SkillCategory = { id: string; name: string; displayOrder: number };

function SortableSkillRow({ skill }: { skill: Skill }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: skill.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 px-4 py-3 bg-white ${isDragging ? "shadow-md rounded-lg z-10 opacity-90" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        aria-label={`Drag to reorder ${skill.name}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {skill.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={skill.iconUrl}
          alt={`${skill.name} icon`}
          className="h-5 w-5 object-contain shrink-0"
        />
      ) : skill.icon ? (
        <span className="text-lg" aria-hidden="true">
          {skill.icon}
        </span>
      ) : null}
      <span className="text-sm font-medium text-gray-700 flex-1">{skill.name}</span>
      {skill.proficiencyLevel && (
        <Badge variant="outline" className="text-xs">
          {skill.proficiencyLevel}
        </Badge>
      )}
      {!skill.visible && (
        <Badge variant="secondary" className="text-xs">
          Hidden
        </Badge>
      )}
    </div>
  );
}

function SortableCategoryRow({ category }: { category: SkillCategory }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 px-4 py-2.5 bg-white ${isDragging ? "shadow-md rounded-lg z-10 opacity-90" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        aria-label={`Drag to reorder ${category.name}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm font-medium text-gray-700">{category.name}</span>
    </div>
  );
}

export function SkillsManagerSection() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [draftOrder, setDraftOrder] = useState<SkillCategory[]>([]);
  const [editingOrderCategory, setEditingOrderCategory] = useState<string | null>(null);
  const [draftSkillOrder, setDraftSkillOrder] = useState<Skill[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

  const { data: categoriesData } = useQuery({
    queryKey: ["admin", "skill-categories"],
    queryFn: () => apiClient.getSkillCategories<SkillCategory, { total: number }>(),
  });

  const categories: SkillCategory[] = (categoriesData?.data as SkillCategory[]) ?? [];

  const reorderCategoriesMutation = useMutation({
    mutationFn: (orderedIds: string[]) => apiClient.reorderSkillCategories(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "skill-categories"] });
      setIsEditingOrder(false);
      toast.success("Category order saved");
    },
    onError: () => toast.error("Failed to save category order"),
  });

  function handleEditOrder() {
    setDraftOrder([...categories]);
    setIsEditingOrder(true);
  }

  function handleCancelOrder() {
    setDraftOrder([]);
    setIsEditingOrder(false);
  }

  function handleSaveOrder() {
    reorderCategoriesMutation.mutate(draftOrder.map((c) => c.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = draftOrder.findIndex((c) => c.id === active.id);
    const newIndex = draftOrder.findIndex((c) => c.id === over.id);
    setDraftOrder(arrayMove(draftOrder, oldIndex, newIndex));
  }

  const reorderSkillsMutation = useMutation({
    mutationFn: (orderedIds: string[]) => apiClient.reorderSkills(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "skills"] });
      setEditingOrderCategory(null);
      toast.success("Skill order saved");
    },
    onError: () => toast.error("Failed to save skill order"),
  });

  function handleSkillDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = draftSkillOrder.findIndex((s) => s.id === active.id);
    const newIndex = draftSkillOrder.findIndex((s) => s.id === over.id);
    setDraftSkillOrder(arrayMove(draftSkillOrder, oldIndex, newIndex));
  }

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
        <h2 className="text-xl font-semibold">Skills</h2>
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
          {categories.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Category Order
                </h3>
                {isEditingOrder ? (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelOrder}
                      disabled={reorderCategoriesMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveOrder}
                      disabled={reorderCategoriesMutation.isPending}
                    >
                      {reorderCategoriesMutation.isPending ? "Saving…" : "Save Order"}
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleEditOrder}>
                    Edit Order
                  </Button>
                )}
              </div>

              <div className="rounded-lg border bg-white divide-y overflow-hidden">
                {isEditingOrder ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={draftOrder.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {draftOrder.map((cat) => (
                        <SortableCategoryRow key={cat.id} category={cat} />
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="px-4 py-2.5 text-sm font-medium text-gray-700">
                      {cat.name}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {Object.entries(groupedSkills).map(([category, skills]) => {
            const isEditingThisCategory = editingOrderCategory === category;
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{category}</h3>
                  {isEditingThisCategory ? (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingOrderCategory(null)}
                        disabled={reorderSkillsMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          reorderSkillsMutation.mutate(draftSkillOrder.map((s) => s.id))
                        }
                        disabled={reorderSkillsMutation.isPending}
                      >
                        {reorderSkillsMutation.isPending ? "Saving…" : "Save Order"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDraftSkillOrder([...skills]);
                        setEditingOrderCategory(category);
                      }}
                      disabled={editingOrderCategory !== null}
                    >
                      Edit Order
                    </Button>
                  )}
                </div>
                <div className="bg-white rounded-lg border divide-y overflow-hidden">
                  {isEditingThisCategory ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleSkillDragEnd}
                    >
                      <SortableContext
                        items={draftSkillOrder.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {draftSkillOrder.map((skill) => (
                          <SortableSkillRow key={skill.id} skill={skill} />
                        ))}
                      </SortableContext>
                    </DndContext>
                  ) : (
                    skills.map((skill) => (
                      <div key={skill.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          {skill.iconUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={skill.iconUrl}
                              alt={`${skill.name} icon`}
                              className="h-6 w-6 object-contain shrink-0"
                            />
                          ) : skill.icon ? (
                            <span className="text-xl" aria-hidden="true">
                              {skill.icon}
                            </span>
                          ) : null}
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
                    ))
                  )}
                </div>
              </div>
            );
          })}
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
