"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/admin/ImageUpload";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";

interface SkillFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Skill | null;
}

const PROFICIENCY_LEVELS: ProficiencyLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

export function SkillFormDialog({ open, onOpenChange, initialData }: SkillFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData;
  const [uploadEntityId] = useState(() => crypto.randomUUID());
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  const { data: categoriesData } = useQuery({
    queryKey: ["admin", "skill-categories"],
    queryFn: () => apiClient.getSkillCategories<{ id: string; name: string }, unknown>(),
  });
  const categories = categoriesData?.data ?? [];

  const form = useForm<SkillCreateInput>({
    resolver: zodResolver(skillCreateSchema) as Resolver<SkillCreateInput>,
    defaultValues: initialData
      ? {
          name: initialData.name,
          category: initialData.category,
          icon: initialData.icon ?? "",
          iconUrl: initialData.iconUrl ?? "",
          proficiencyLevel: initialData.proficiencyLevel ?? undefined,
          displayOrder: initialData.displayOrder,
          visible: initialData.visible,
        }
      : {
          name: "",
          category: "",
          icon: "",
          iconUrl: "",
          proficiencyLevel: undefined,
          displayOrder: 0,
          visible: true,
        },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        initialData
          ? {
              name: initialData.name,
              category: initialData.category,
              icon: initialData.icon ?? "",
              iconUrl: initialData.iconUrl ?? "",
              proficiencyLevel: initialData.proficiencyLevel ?? undefined,
              displayOrder: initialData.displayOrder,
              visible: initialData.visible,
            }
          : {
              name: "",
              category: "",
              icon: "",
              iconUrl: "",
              proficiencyLevel: undefined,
              displayOrder: 0,
              visible: true,
            }
      );
    }
  }, [open, initialData, form]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const catInput = useWatch({ control: form.control, name: "category" });
  const proficiencyLevel = useWatch({ control: form.control, name: "proficiencyLevel" });
  const visible = useWatch({ control: form.control, name: "visible" });
  const iconUrl = useWatch({ control: form.control, name: "iconUrl" });

  const mutation = useMutation({
    mutationFn: (values: SkillCreateInput) =>
      isEditing ? apiClient.updateSkill(initialData.id, values) : apiClient.createSkill(values),
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
      <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Skill" : "Add Skill"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the skill information below."
              : "Add a new skill to your portfolio."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
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
              <div ref={catRef} className="relative">
                <Input
                  id="category"
                  value={catInput}
                  placeholder="e.g., Frontend, Backend, DevOps"
                  aria-invalid={!!form.formState.errors.category}
                  aria-describedby={form.formState.errors.category ? "category-error" : undefined}
                  autoComplete="off"
                  onFocus={() => setCatOpen(true)}
                  onChange={(e) => {
                    form.setValue("category", e.target.value, { shouldValidate: true });
                    setCatOpen(true);
                  }}
                />
                {catOpen && (
                  <div className="absolute z-50 w-full mt-1 border rounded-md bg-popover shadow-md max-h-48 overflow-y-auto">
                    {categories
                      .filter((c) => c.name.toLowerCase().includes(catInput.toLowerCase()))
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            form.setValue("category", c.name, { shouldValidate: true });
                            setCatOpen(false);
                          }}
                        >
                          {c.name}
                        </button>
                      ))}
                    {catInput.length > 0 &&
                      !categories.some((c) => c.name.toLowerCase() === catInput.toLowerCase()) && (
                        <div className="px-3 py-2 text-sm text-muted-foreground border-t">
                          Create new:{" "}
                          <span className="font-medium text-foreground">{catInput}</span>
                        </div>
                      )}
                    {categories.filter((c) => c.name.toLowerCase().includes(catInput.toLowerCase()))
                      .length === 0 &&
                      catInput.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No categories yet
                        </div>
                      )}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Type a new category name or choose from existing ones.
              </p>
              {form.formState.errors.category && (
                <p id="category-error" className="text-sm text-red-500">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Emoji Icon (optional)</Label>
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
              <p className="text-xs text-muted-foreground">Add an emoji to represent this skill.</p>
            </div>

            <div className="space-y-2">
              <Label>Image Icon (optional)</Label>
              <ImageUpload
                folder="logos"
                entityId={uploadEntityId}
                value={iconUrl || undefined}
                onUpload={(result) => {
                  const url = result.urls.display ?? result.urls.original ?? "";
                  form.setValue("iconUrl", url, { shouldValidate: true });
                }}
                onRemove={() => {
                  form.setValue("iconUrl", "", { shouldValidate: true });
                }}
                className="w-40 h-24 overflow-hidden"
                placeholder="Drop image"
              />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Upload an image, or paste a URL:</p>
                <Input
                  type="url"
                  {...form.register("iconUrl")}
                  placeholder="https://cdn.example.com/icon.svg"
                  aria-invalid={!!form.formState.errors.iconUrl}
                />
                {form.formState.errors.iconUrl && (
                  <p className="text-sm text-red-500">{form.formState.errors.iconUrl.message}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Image takes priority over emoji when both are set.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proficiencyLevel">Proficiency Level (optional)</Label>
              <Select
                value={proficiencyLevel ?? undefined}
                onValueChange={(value) => {
                  form.setValue("proficiencyLevel", value as ProficiencyLevel, {
                    shouldValidate: true,
                  });
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
          </div>

          <DialogFooter className="pt-4">
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
