"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/api-client";
import { SkillCreateInput, skillCreateSchema } from "@/lib/validations/skill";
import { Skill, ProficiencyLevel } from "@/types/skill";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";

interface SkillFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Skill | null;
}

const PROFICIENCY_LEVELS: ProficiencyLevel[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
];

export function SkillFormDialog({ open, onOpenChange, initialData }: SkillFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const form = useForm<SkillCreateInput>({
    resolver: zodResolver(skillCreateSchema) as Resolver<SkillCreateInput>,
    defaultValues: initialData
      ? {
          name: initialData.name,
          category: initialData.category,
          icon: initialData.icon ?? "",
          proficiencyLevel: initialData.proficiencyLevel ?? undefined,
          displayOrder: initialData.displayOrder,
          visible: initialData.visible,
        }
      : {
          name: "",
          category: "",
          icon: "",
          proficiencyLevel: undefined,
          displayOrder: 0,
          visible: true,
        },
  });

  const proficiencyLevel = useWatch({ control: form.control, name: "proficiencyLevel" });
  const visible = useWatch({ control: form.control, name: "visible" });

  const mutation = useMutation({
    mutationFn: (values: SkillCreateInput) =>
      isEditing
        ? apiClient.updateSkill(initialData.id, values)
        : apiClient.createSkill(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "skills"] });
      toast.success(isEditing ? "Skill updated" : "Skill created");
      onOpenChange(false);
      form.reset();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to save skill";
      toast.error(message);
    },
  });

  const handleSubmit = (values: SkillCreateInput) => {
    mutation.mutate(values);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !mutation.isPending) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Skill" : "Add Skill"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the skill information below."
              : "Add a new skill to your portfolio."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="e.g., React, TypeScript"
              aria-invalid={!!form.formState.errors.name}
              aria-describedby={form.formState.errors.name ? "name-error" : undefined}
            />
            {form.formState.errors.name && (
              <p id="name-error" className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              {...form.register("category")}
              placeholder="e.g., Frontend, Backend, DevOps"
              aria-invalid={!!form.formState.errors.category}
              aria-describedby={form.formState.errors.category ? "category-error" : undefined}
            />
            {form.formState.errors.category && (
              <p id="category-error" className="text-sm text-red-500">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon (optional)</Label>
            <Input
              id="icon"
              {...form.register("icon")}
              placeholder="e.g., ⚛️ or emoji"
              aria-invalid={!!form.formState.errors.icon}
              aria-describedby={form.formState.errors.icon ? "icon-error" : undefined}
            />
            {form.formState.errors.icon && (
              <p id="icon-error" className="text-sm text-red-500">
                {form.formState.errors.icon.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Add an emoji or icon to represent this skill.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proficiencyLevel">Proficiency Level (optional)</Label>
            <Select
              value={proficiencyLevel ?? undefined}
              onValueChange={(value) => {
                form.setValue(
                  "proficiencyLevel",
                  value as ProficiencyLevel,
                  { shouldValidate: true }
                );
              }}
            >
              <SelectTrigger id="proficiencyLevel">
                <SelectValue placeholder="Select proficiency level" />
              </SelectTrigger>
              <SelectContent>
                {PROFICIENCY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.proficiencyLevel && (
              <p className="text-sm text-red-500">
                {form.formState.errors.proficiencyLevel.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              {...form.register("displayOrder", { valueAsNumber: true })}
              placeholder="0"
              aria-invalid={!!form.formState.errors.displayOrder}
              aria-describedby={
                form.formState.errors.displayOrder ? "displayOrder-error" : undefined
              }
            />
            {form.formState.errors.displayOrder && (
              <p id="displayOrder-error" className="text-sm text-red-500">
                {form.formState.errors.displayOrder.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first within the category.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Switch
              id="visible"
              checked={visible}
              onCheckedChange={(val) => form.setValue("visible", val)}
            />
            <Label htmlFor="visible" className="cursor-pointer">
              Visible on public site
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
