"use client";

import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import type { DragEndEvent } from "@dnd-kit/core";

export type UseDndReorderOptions<T extends { id: string }> = {
  /** Current items from the query (source of truth). */
  items: T[];
  /** API call that persists the new order. Receives ordered IDs. */
  mutationFn: (orderedIds: string[]) => Promise<unknown>;
  /** TanStack Query key(s) to invalidate after a successful save. */
  queryKey: string[];
  /** Toast message on success. */
  successMessage?: string;
};

export type UseDndReorderReturn<T> = {
  /** Whether reorder mode is active. */
  isEditing: boolean;
  /** The draft list used during reorder mode. */
  draftItems: T[];
  /** dnd-kit sensors — pass to `<DndContext sensors={...}>`. */
  sensors: ReturnType<typeof useSensors>;
  /** Enter reorder mode (snapshots current items). */
  enterEditMode: () => void;
  /** Cancel reorder mode (discards draft). */
  cancelEditMode: () => void;
  /** Persist the current draft order. */
  saveOrder: () => void;
  /** Handler for `<DndContext onDragEnd={...}>`. */
  handleDragEnd: (event: DragEndEvent) => void;
  /** Whether the save mutation is in flight. */
  isSaving: boolean;
};

/**
 * Generic drag-and-drop reorder hook for admin list sections.
 *
 * Encapsulates draft state, dnd-kit sensors, drag handler, and the
 * save mutation. Follows the pattern established in SkillsManagerSection.
 */
export function useDndReorder<T extends { id: string }>({
  items,
  mutationFn,
  queryKey,
  successMessage = "Order saved",
}: UseDndReorderOptions<T>): UseDndReorderReturn<T> {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [draftItems, setDraftItems] = useState<T[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const mutation = useMutation({
    mutationFn: (orderedIds: string[]) => mutationFn(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setIsEditing(false);
      setDraftItems([]);
      toast.success(successMessage);
    },
    onError: () => {
      toast.error("Failed to save order");
    },
  });

  function enterEditMode() {
    setDraftItems([...items]);
    setIsEditing(true);
  }

  function cancelEditMode() {
    setDraftItems([]);
    setIsEditing(false);
  }

  function saveOrder() {
    mutation.mutate(draftItems.map((item) => item.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = draftItems.findIndex((item) => item.id === active.id);
    const newIndex = draftItems.findIndex((item) => item.id === over.id);
    setDraftItems(arrayMove(draftItems, oldIndex, newIndex));
  }

  return {
    isEditing,
    draftItems,
    sensors,
    enterEditMode,
    cancelEditMode,
    saveOrder,
    handleDragEnd,
    isSaving: mutation.isPending,
  };
}

// Re-export dnd-kit components consumers need, so they don't import from 3 packages.
export { DndContext, closestCenter, SortableContext, verticalListSortingStrategy };
