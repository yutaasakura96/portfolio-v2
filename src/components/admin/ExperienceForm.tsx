"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { ExperienceCreateInput, experienceCreateSchema } from "@/lib/validations/experience";
import { Experience } from "@/types/experience";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

interface ExperienceFormProps {
  initialData?: Experience;
  experienceId?: string;
}

export function ExperienceForm({ initialData, experienceId }: ExperienceFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!experienceId;

  const [highlights, setHighlights] = useState<string[]>(initialData?.highlights ?? []);
  const [newHighlight, setNewHighlight] = useState("");

  const form = useForm<ExperienceCreateInput>({
    resolver: zodResolver(experienceCreateSchema) as Resolver<ExperienceCreateInput>,
    defaultValues: initialData
      ? {
          company: initialData.company,
          role: initialData.role,
          location: initialData.location ?? "",
          startDate: initialData.startDate ? new Date(initialData.startDate) : undefined,
          endDate: initialData.endDate ? new Date(initialData.endDate) : undefined,
          description: initialData.description,
          highlights: initialData.highlights ?? [],
          logoUrl: initialData.logoUrl ?? "",
          companyUrl: initialData.companyUrl ?? "",
          displayOrder: initialData.displayOrder,
          visible: initialData.visible,
        }
      : {
          company: "",
          role: "",
          location: "",
          description: "",
          highlights: [],
          logoUrl: "",
          companyUrl: "",
          displayOrder: 0,
          visible: true,
        },
  });

  const mutation = useMutation({
    mutationFn: (values: ExperienceCreateInput) =>
      isEditing
        ? apiClient.updateExperience(experienceId, values)
        : apiClient.createExperience(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "experience"] });
      toast.success(isEditing ? "Experience updated" : "Experience created");
      router.push("/admin/experience");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to save experience";
      toast.error(message);
    },
  });

  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      const updatedHighlights = [...highlights, newHighlight.trim()];
      setHighlights(updatedHighlights);
      form.setValue("highlights", updatedHighlights, { shouldValidate: true });
      setNewHighlight("");
    }
  };

  const handleRemoveHighlight = (index: number) => {
    const updatedHighlights = highlights.filter((_, i) => i !== index);
    setHighlights(updatedHighlights);
    form.setValue("highlights", updatedHighlights, { shouldValidate: true });
  };

  const visible = form.watch("visible");

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values as ExperienceCreateInput))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                {...form.register("company")}
                aria-invalid={!!form.formState.errors.company}
                aria-describedby={form.formState.errors.company ? "company-error" : undefined}
              />
              {form.formState.errors.company && (
                <p id="company-error" className="text-sm text-red-500">
                  {form.formState.errors.company.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                {...form.register("role")}
                aria-invalid={!!form.formState.errors.role}
                aria-describedby={form.formState.errors.role ? "role-error" : undefined}
              />
              {form.formState.errors.role && (
                <p id="role-error" className="text-sm text-red-500">
                  {form.formState.errors.role.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...form.register("location")}
              placeholder="e.g., San Francisco, CA"
              aria-invalid={!!form.formState.errors.location}
              aria-describedby={form.formState.errors.location ? "location-error" : undefined}
            />
            {form.formState.errors.location && (
              <p id="location-error" className="text-sm text-red-500">
                {form.formState.errors.location.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
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
              <p className="text-xs text-muted-foreground">Leave empty for current position</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              rows={6}
              {...form.register("description")}
              placeholder="Describe your role and responsibilities..."
              aria-invalid={!!form.formState.errors.description}
              aria-describedby={form.formState.errors.description ? "description-error" : undefined}
            />
            {form.formState.errors.description && (
              <p id="description-error" className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="highlights">Key Highlights</Label>
            <div className="flex gap-2">
              <Input
                id="highlights"
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddHighlight();
                  }
                }}
                placeholder="Add a key achievement or responsibility..."
              />
              <Button type="button" onClick={handleAddHighlight} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {highlights.length > 0 && (
              <div className="space-y-2 mt-2">
                {highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <span className="flex-1 text-sm">{highlight}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveHighlight(index)}
                      aria-label={`Remove highlight ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Add key achievements, responsibilities, or notable accomplishments
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyUrl">Company URL</Label>
              <Input
                id="companyUrl"
                type="url"
                {...form.register("companyUrl")}
                placeholder="https://..."
                aria-invalid={!!form.formState.errors.companyUrl}
                aria-describedby={form.formState.errors.companyUrl ? "companyUrl-error" : undefined}
              />
              {form.formState.errors.companyUrl && (
                <p id="companyUrl-error" className="text-sm text-red-500">
                  {form.formState.errors.companyUrl.message}
                </p>
              )}
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
                  ? "Update Experience"
                  : "Create Experience"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/experience")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
