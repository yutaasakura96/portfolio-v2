"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { ProjectCreateInput, projectCreateSchema } from "@/lib/validations/project";
import { Project } from "@/types/project";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

interface ProjectFormProps {
  initialData?: Project;
  projectId?: string;
}

/**
 * Auto-generate slug from title.
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProjectForm({ initialData, projectId }: ProjectFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!projectId;

  const [techTagsInput, setTechTagsInput] = useState(initialData?.techTags?.join(", ") ?? "");

  const form = useForm<ProjectCreateInput>({
    resolver: zodResolver(projectCreateSchema) as Resolver<ProjectCreateInput>,
    defaultValues: initialData
      ? {
          title: initialData.title,
          slug: initialData.slug,
          shortDescription: initialData.shortDescription,
          description: initialData.description ?? "",
          problem: initialData.problem ?? "",
          solution: initialData.solution ?? "",
          role: initialData.role ?? "",
          techTags: (initialData.techTags ?? []) as string[],
          images: (initialData.images ?? []) as Array<{ url: string; alt: string; order: number }>,
          thumbnailImage: initialData.thumbnailImage ?? "",
          liveUrl: initialData.liveUrl ?? "",
          repoUrl: initialData.repoUrl ?? "",
          featured: initialData.featured ?? false,
          displayOrder: initialData.displayOrder ?? 0,
          status: initialData.status ?? "DRAFT",
          startDate: initialData.startDate ? new Date(initialData.startDate) : undefined,
          endDate: initialData.endDate ? new Date(initialData.endDate) : undefined,
        }
      : {
          title: "",
          slug: "",
          shortDescription: "",
          description: "",
          techTags: [],
          images: [],
          thumbnailImage: "",
          status: "DRAFT" as const,
          featured: false,
          displayOrder: 0,
        },
  });

  const mutation = useMutation({
    mutationFn: (values: ProjectCreateInput) =>
      isEditing ? apiClient.updateProject(projectId, values) : apiClient.createProject(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
      toast.success(isEditing ? "Project updated" : "Project created");
      router.push("/admin/projects");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to save project";
      toast.error(message);
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("title", e.target.value);
    if (!isEditing) {
      form.setValue("slug", generateSlug(e.target.value));
    }
  };

  const handleTechTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTechTagsInput(e.target.value);
  };

  const handleTechTagsBlur = () => {
    const tags = techTagsInput
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean);
    form.setValue("techTags", tags, { shouldValidate: true });
  };

  const shortDescLength = form.watch("shortDescription")?.length ?? 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values as ProjectCreateInput))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...form.register("title")}
                onChange={handleTitleChange}
                aria-invalid={!!form.formState.errors.title}
                aria-describedby={form.formState.errors.title ? "title-error" : undefined}
              />
              {form.formState.errors.title && (
                <p id="title-error" className="text-sm text-red-500">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                {...form.register("slug")}
                aria-invalid={!!form.formState.errors.slug}
                aria-describedby={form.formState.errors.slug ? "slug-error" : undefined}
              />
              {form.formState.errors.slug && (
                <p id="slug-error" className="text-sm text-red-500">
                  {form.formState.errors.slug.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="shortDescription">Short Description *</Label>
              <span
                className={`text-xs ${shortDescLength > 300 ? "text-red-500" : "text-gray-500"}`}
              >
                {shortDescLength}/300
              </span>
            </div>
            <Input
              id="shortDescription"
              {...form.register("shortDescription")}
              maxLength={300}
              aria-invalid={!!form.formState.errors.shortDescription}
              aria-describedby={
                form.formState.errors.shortDescription ? "shortDescription-error" : undefined
              }
            />
            {form.formState.errors.shortDescription && (
              <p id="shortDescription-error" className="text-sm text-red-500">
                {form.formState.errors.shortDescription.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              rows={6}
              {...form.register("description")}
              aria-invalid={!!form.formState.errors.description}
              aria-describedby={form.formState.errors.description ? "description-error" : undefined}
            />
            {form.formState.errors.description && (
              <p id="description-error" className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="problem">Problem</Label>
              <Textarea
                id="problem"
                rows={3}
                {...form.register("problem")}
                aria-invalid={!!form.formState.errors.problem}
                aria-describedby={form.formState.errors.problem ? "problem-error" : undefined}
              />
              {form.formState.errors.problem && (
                <p id="problem-error" className="text-sm text-red-500">
                  {form.formState.errors.problem.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="solution">Solution</Label>
              <Textarea
                id="solution"
                rows={3}
                {...form.register("solution")}
                aria-invalid={!!form.formState.errors.solution}
                aria-describedby={form.formState.errors.solution ? "solution-error" : undefined}
              />
              {form.formState.errors.solution && (
                <p id="solution-error" className="text-sm text-red-500">
                  {form.formState.errors.solution.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              {...form.register("role")}
              placeholder="e.g., Full-stack Developer, Technical Lead"
              aria-invalid={!!form.formState.errors.role}
              aria-describedby={form.formState.errors.role ? "role-error" : undefined}
            />
            {form.formState.errors.role && (
              <p id="role-error" className="text-sm text-red-500">
                {form.formState.errors.role.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="techTags">Tech Tags (comma-separated) *</Label>
            <Input
              id="techTags"
              value={techTagsInput}
              onChange={handleTechTagsChange}
              onBlur={handleTechTagsBlur}
              placeholder="React, TypeScript, AWS"
              aria-invalid={!!form.formState.errors.techTags}
              aria-describedby={form.formState.errors.techTags ? "techTags-error" : undefined}
            />
            {form.formState.errors.techTags && (
              <p id="techTags-error" className="text-sm text-red-500">
                {form.formState.errors.techTags.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...form.register("startDate")}
                aria-invalid={!!form.formState.errors.startDate}
                aria-describedby={form.formState.errors.startDate ? "startDate-error" : undefined}
              />
              {form.formState.errors.startDate && (
                <p id="startDate-error" className="text-sm text-red-500">
                  {form.formState.errors.startDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...form.register("endDate")}
                aria-invalid={!!form.formState.errors.endDate}
                aria-describedby={form.formState.errors.endDate ? "endDate-error" : undefined}
              />
              {form.formState.errors.endDate && (
                <p id="endDate-error" className="text-sm text-red-500">
                  {form.formState.errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="liveUrl">Live URL</Label>
              <Input
                id="liveUrl"
                type="url"
                {...form.register("liveUrl")}
                placeholder="https://..."
                aria-invalid={!!form.formState.errors.liveUrl}
                aria-describedby={form.formState.errors.liveUrl ? "liveUrl-error" : undefined}
              />
              {form.formState.errors.liveUrl && (
                <p id="liveUrl-error" className="text-sm text-red-500">
                  {form.formState.errors.liveUrl.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="repoUrl">Repository URL</Label>
              <Input
                id="repoUrl"
                type="url"
                {...form.register("repoUrl")}
                placeholder="https://..."
                aria-invalid={!!form.formState.errors.repoUrl}
                aria-describedby={form.formState.errors.repoUrl ? "repoUrl-error" : undefined}
              />
              {form.formState.errors.repoUrl && (
                <p id="repoUrl-error" className="text-sm text-red-500">
                  {form.formState.errors.repoUrl.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnailImage">Thumbnail Image URL</Label>
            <Input
              id="thumbnailImage"
              type="url"
              {...form.register("thumbnailImage")}
              placeholder="https://..."
              aria-invalid={!!form.formState.errors.thumbnailImage}
              aria-describedby={
                form.formState.errors.thumbnailImage ? "thumbnailImage-error" : undefined
              }
            />
            {form.formState.errors.thumbnailImage && (
              <p id="thumbnailImage-error" className="text-sm text-red-500">
                {form.formState.errors.thumbnailImage.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Image upload will be available in Sprint 4. Use a placeholder URL for now.
            </p>
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
              Lower numbers appear first. Leave at 0 for automatic ordering.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="featured"
                checked={form.watch("featured")}
                onCheckedChange={(val) => form.setValue("featured", val)}
              />
              <Label htmlFor="featured">Featured</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="status"
                checked={form.watch("status") === "PUBLISHED"}
                onCheckedChange={(val) => form.setValue("status", val ? "PUBLISHED" : "DRAFT")}
              />
              <Label htmlFor="status">
                {form.watch("status") === "PUBLISHED" ? "Published" : "Draft"}
              </Label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : isEditing ? "Update Project" : "Create Project"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/projects")}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
