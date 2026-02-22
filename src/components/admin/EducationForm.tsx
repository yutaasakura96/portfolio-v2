"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import {
  EducationCreateInput,
  educationCreateSchema,
} from "@/lib/validations/education";
import { Education } from "@/types/education";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

interface EducationFormProps {
  initialData?: Education;
  educationId?: string;
}

export function EducationForm({ initialData, educationId }: EducationFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!educationId;

  const form = useForm<EducationCreateInput>({
    resolver: zodResolver(educationCreateSchema) as Resolver<EducationCreateInput>,
    defaultValues: initialData
      ? {
          institution: initialData.institution,
          degree: initialData.degree,
          field: initialData.field,
          startDate: initialData.startDate ? new Date(initialData.startDate) : undefined,
          endDate: initialData.endDate ? new Date(initialData.endDate) : undefined,
          achievements: initialData.achievements ?? "",
          logoUrl: initialData.logoUrl ?? "",
          displayOrder: initialData.displayOrder,
          visible: initialData.visible,
        }
      : {
          institution: "",
          degree: "",
          field: "",
          achievements: "",
          logoUrl: "",
          displayOrder: 0,
          visible: true,
        },
  });

  const mutation = useMutation({
    mutationFn: (values: EducationCreateInput) =>
      isEditing
        ? apiClient.updateEducation(educationId, values)
        : apiClient.createEducation(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "education"] });
      toast.success(isEditing ? "Education updated" : "Education created");
      router.push("/admin/education");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to save education";
      toast.error(message);
    },
  });

  const visible = form.watch("visible");
  const achievementsLength = form.watch("achievements")?.length ?? 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          onSubmit={form.handleSubmit((values) =>
            mutation.mutate(values as EducationCreateInput)
          )}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="institution">Institution *</Label>
            <Input
              id="institution"
              {...form.register("institution")}
              placeholder="e.g., Stanford University"
              aria-invalid={!!form.formState.errors.institution}
              aria-describedby={
                form.formState.errors.institution ? "institution-error" : undefined
              }
            />
            {form.formState.errors.institution && (
              <p id="institution-error" className="text-sm text-red-500">
                {form.formState.errors.institution.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="degree">Degree *</Label>
              <Input
                id="degree"
                {...form.register("degree")}
                placeholder="e.g., Bachelor of Science"
                aria-invalid={!!form.formState.errors.degree}
                aria-describedby={form.formState.errors.degree ? "degree-error" : undefined}
              />
              {form.formState.errors.degree && (
                <p id="degree-error" className="text-sm text-red-500">
                  {form.formState.errors.degree.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="field">Field of Study *</Label>
              <Input
                id="field"
                {...form.register("field")}
                placeholder="e.g., Computer Science"
                aria-invalid={!!form.formState.errors.field}
                aria-describedby={form.formState.errors.field ? "field-error" : undefined}
              />
              {form.formState.errors.field && (
                <p id="field-error" className="text-sm text-red-500">
                  {form.formState.errors.field.message}
                </p>
              )}
            </div>
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
              <p className="text-xs text-muted-foreground">
                Leave empty for expected graduation
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="achievements">Achievements & Activities</Label>
              <span
                className={`text-xs ${achievementsLength > 5000 ? "text-red-500" : "text-gray-500"}`}
              >
                {achievementsLength}/5000
              </span>
            </div>
            <Textarea
              id="achievements"
              rows={8}
              {...form.register("achievements")}
              placeholder="Notable achievements, honors, activities, or coursework..."
              maxLength={5000}
              aria-invalid={!!form.formState.errors.achievements}
              aria-describedby={
                form.formState.errors.achievements ? "achievements-error" : undefined
              }
            />
            {form.formState.errors.achievements && (
              <p id="achievements-error" className="text-sm text-red-500">
                {form.formState.errors.achievements.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Add honors, awards, relevant coursework, or extracurricular activities
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              type="url"
              {...form.register("logoUrl")}
              placeholder="https://..."
              aria-invalid={!!form.formState.errors.logoUrl}
              aria-describedby={form.formState.errors.logoUrl ? "logoUrl-error" : undefined}
            />
            {form.formState.errors.logoUrl && (
              <p id="logoUrl-error" className="text-sm text-red-500">
                {form.formState.errors.logoUrl.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Institution logo or seal image URL
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

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Saving..."
                : isEditing
                  ? "Update Education"
                  : "Create Education"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/education")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
