"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { HeroUpdateInput, heroUpdateSchema } from "@/lib/validations/hero";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

type Hero = {
  id: string;
  headline: string;
  subheadline: string | null;
  bio: string;
  profileImage: string;
  resumeUrl: string | null;
  ctaButtons: unknown;
  updatedAt: Date;
};

type HeroResponse = {
  data: Hero;
};

export default function HeroEditorPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<HeroResponse>({
    queryKey: ["hero"],
    queryFn: () => apiClient.getHero<Hero>(),
  });

  const form = useForm<HeroUpdateInput>({
    resolver: zodResolver(heroUpdateSchema),
    values: data?.data
      ? {
          headline: data.data.headline,
          subheadline: data.data.subheadline ?? "",
          bio: data.data.bio,
          profileImage: data.data.profileImage ?? "",
          resumeUrl: data.data.resumeUrl ?? "",
          ctaButtons: Array.isArray(data.data.ctaButtons) ? data.data.ctaButtons : [],
        }
      : undefined,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ctaButtons",
  });

  const mutation = useMutation({
    mutationFn: (values: HeroUpdateInput) => apiClient.updateHero<HeroUpdateInput, Hero>(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero"] });
      toast.success("Hero section updated");
      form.reset(form.getValues());
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update hero section");
    },
  });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const headlineValue = form.watch("headline");
  const subheadlineValue = form.watch("subheadline");
  const profileImageValue = form.watch("profileImage");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Hero Section</h1>
        {form.formState.isDirty && (
          <span className="text-sm text-amber-600 font-medium">● Unsaved changes</span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Homepage Hero</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="headline">
                Headline <span className="text-red-500">*</span>
              </Label>
              <Input
                id="headline"
                {...form.register("headline")}
                aria-invalid={!!form.formState.errors.headline}
                aria-describedby={form.formState.errors.headline ? "headline-error" : undefined}
              />
              <div className="flex items-center justify-between">
                {form.formState.errors.headline && (
                  <p id="headline-error" className="text-sm text-red-500">
                    {form.formState.errors.headline.message}
                  </p>
                )}
                <p
                  className={`text-xs ml-auto ${headlineValue?.length > 200 ? "text-red-500" : "text-muted-foreground"}`}
                >
                  {headlineValue?.length || 0}/200
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subheadline">Subheadline</Label>
              <Input
                id="subheadline"
                {...form.register("subheadline")}
                aria-invalid={!!form.formState.errors.subheadline}
                aria-describedby={
                  form.formState.errors.subheadline ? "subheadline-error" : undefined
                }
              />
              <div className="flex items-center justify-between">
                {form.formState.errors.subheadline && (
                  <p id="subheadline-error" className="text-sm text-red-500">
                    {form.formState.errors.subheadline.message}
                  </p>
                )}
                <p
                  className={`text-xs ml-auto ${(subheadlineValue?.length ?? 0) > 300 ? "text-red-500" : "text-muted-foreground"}`}
                >
                  {subheadlineValue?.length || 0}/300
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">
                Bio <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="bio"
                rows={5}
                {...form.register("bio")}
                aria-invalid={!!form.formState.errors.bio}
                aria-describedby={form.formState.errors.bio ? "bio-error" : undefined}
              />
              {form.formState.errors.bio && (
                <p id="bio-error" className="text-sm text-red-500">
                  {form.formState.errors.bio.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profileImage">Profile Image URL</Label>
              <Input
                id="profileImage"
                {...form.register("profileImage")}
                placeholder="https://example.com/image.jpg"
                aria-invalid={!!form.formState.errors.profileImage}
                aria-describedby={
                  form.formState.errors.profileImage ? "profileImage-error" : undefined
                }
              />
              {form.formState.errors.profileImage && (
                <p id="profileImage-error" className="text-sm text-red-500">
                  {form.formState.errors.profileImage.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Image upload will be available in Sprint 4. For now, use a URL.
              </p>
              {profileImageValue && profileImageValue !== "" && (
                <div className="mt-3 p-4 border rounded-lg bg-muted/20">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <div className="relative w-24 h-24">
                    <Image
                      src={profileImageValue}
                      alt="Profile preview"
                      width={96}
                      height={96}
                      className="rounded-full object-cover border-2 border-gray-200"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="resumeUrl">Resume URL</Label>
              <Input
                id="resumeUrl"
                {...form.register("resumeUrl")}
                placeholder="https://example.com/resume.pdf"
                aria-invalid={!!form.formState.errors.resumeUrl}
                aria-describedby={form.formState.errors.resumeUrl ? "resumeUrl-error" : undefined}
              />
              {form.formState.errors.resumeUrl && (
                <p id="resumeUrl-error" className="text-sm text-red-500">
                  {form.formState.errors.resumeUrl.message}
                </p>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Call-to-Action Buttons</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add up to 4 buttons for the hero section (e.g., &quot;View Projects&quot;,
                    &quot;Contact Me&quot;)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ label: "", url: "", variant: "primary" })}
                  disabled={fields.length >= 4}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Button
                </Button>
              </div>

              {fields.length > 0 && (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg space-y-3 bg-muted/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Button {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`ctaButtons.${index}.label`}>
                            Label <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`ctaButtons.${index}.label`}
                            {...form.register(`ctaButtons.${index}.label` as const)}
                            placeholder="View Projects"
                            aria-invalid={!!form.formState.errors.ctaButtons?.[index]?.label}
                          />
                          {form.formState.errors.ctaButtons?.[index]?.label && (
                            <p className="text-sm text-red-500">
                              {form.formState.errors.ctaButtons[index]?.label?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`ctaButtons.${index}.variant`}>
                            Style <span className="text-red-500">*</span>
                          </Label>
                          <select
                            id={`ctaButtons.${index}.variant`}
                            {...form.register(`ctaButtons.${index}.variant` as const)}
                            className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                          </select>
                          {form.formState.errors.ctaButtons?.[index]?.variant && (
                            <p className="text-sm text-red-500">
                              {form.formState.errors.ctaButtons[index]?.variant?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`ctaButtons.${index}.url`}>
                          URL <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`ctaButtons.${index}.url`}
                          {...form.register(`ctaButtons.${index}.url` as const)}
                          placeholder="/projects or https://..."
                          aria-invalid={!!form.formState.errors.ctaButtons?.[index]?.url}
                        />
                        {form.formState.errors.ctaButtons?.[index]?.url && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.ctaButtons[index]?.url?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {form.formState.errors.ctaButtons &&
                !Array.isArray(form.formState.errors.ctaButtons) && (
                  <p className="text-sm text-red-500">{form.formState.errors.ctaButtons.message}</p>
                )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={mutation.isPending || !form.formState.isDirty}>
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              {form.formState.isDirty && (
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  Discard Changes
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
