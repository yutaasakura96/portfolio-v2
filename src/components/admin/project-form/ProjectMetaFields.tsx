"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ProjectCreateInput } from "@/lib/validations/project";
import { useFormContext, useWatch } from "react-hook-form";

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

interface ProjectMetaFieldsProps {
  isEditing: boolean;
}

export function ProjectMetaFields({ isEditing }: ProjectMetaFieldsProps) {
  const form = useFormContext<ProjectCreateInput>();

  const shortDescLength =
    useWatch({ control: form.control, name: "shortDescription" })?.length ?? 0;
  const featured = useWatch({ control: form.control, name: "featured" });
  const status = useWatch({ control: form.control, name: "status" });
  const watchedStartDate = useWatch({
    control: form.control,
    name: "startDate",
  }) as unknown as string;
  const watchedEndDate = useWatch({ control: form.control, name: "endDate" }) as unknown as string;

  const startDateMax = watchedEndDate
    ? (() => {
        const d = new Date(watchedEndDate + "T00:00:00");
        d.setDate(d.getDate() - 1);
        return d.toISOString().split("T")[0];
      })()
    : undefined;

  const endDateMin = watchedStartDate
    ? (() => {
        const d = new Date(watchedStartDate + "T00:00:00");
        d.setDate(d.getDate() + 1);
        return d.toISOString().split("T")[0];
      })()
    : undefined;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("title", e.target.value);
    if (!isEditing) {
      form.setValue("slug", generateSlug(e.target.value));
    }
  };

  return (
    <>
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
            <p id="title-error" className="text-sm text-destructive">
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
            <p id="slug-error" className="text-sm text-destructive">
              {form.formState.errors.slug.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="shortDescription">Short Description *</Label>
          <span
            className={cn(
              "text-xs",
              shortDescLength > 300 ? "text-destructive" : "text-muted-foreground"
            )}
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
          <p id="shortDescription-error" className="text-sm text-destructive">
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
          <p id="description-error" className="text-sm text-destructive">
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
            <p id="problem-error" className="text-sm text-destructive">
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
            <p id="solution-error" className="text-sm text-destructive">
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
          <p id="role-error" className="text-sm text-destructive">
            {form.formState.errors.role.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            max={startDateMax}
            {...form.register("startDate")}
            aria-invalid={!!form.formState.errors.startDate}
            aria-describedby={form.formState.errors.startDate ? "startDate-error" : undefined}
          />
          {form.formState.errors.startDate && (
            <p id="startDate-error" className="text-sm text-destructive">
              {form.formState.errors.startDate.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            min={endDateMin}
            {...form.register("endDate")}
            aria-invalid={!!form.formState.errors.endDate}
            aria-describedby={form.formState.errors.endDate ? "endDate-error" : undefined}
          />
          {form.formState.errors.endDate && (
            <p id="endDate-error" className="text-sm text-destructive">
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
            <p id="liveUrl-error" className="text-sm text-destructive">
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
            <p id="repoUrl-error" className="text-sm text-destructive">
              {form.formState.errors.repoUrl.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayOrder">Display Order</Label>
        <Input
          id="displayOrder"
          type="number"
          {...form.register("displayOrder", { valueAsNumber: true })}
          placeholder="0"
          aria-invalid={!!form.formState.errors.displayOrder}
          aria-describedby={form.formState.errors.displayOrder ? "displayOrder-error" : undefined}
        />
        {form.formState.errors.displayOrder && (
          <p id="displayOrder-error" className="text-sm text-destructive">
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
            checked={featured}
            onCheckedChange={(val) => form.setValue("featured", val)}
          />
          <Label htmlFor="featured">Featured</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="status"
            checked={status === "PUBLISHED"}
            onCheckedChange={(val) => form.setValue("status", val ? "PUBLISHED" : "DRAFT")}
          />
          <Label htmlFor="status">{status === "PUBLISHED" ? "Published" : "Draft"}</Label>
        </div>
      </div>
    </>
  );
}
