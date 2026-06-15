"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Project } from "@/lib/data/types";
import {
  normalizeImagesToGroups,
  projectCreateSchema,
  type ProjectCreateInput,
} from "@/lib/validations/project";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import { ProjectGallerySection } from "./ProjectGallerySection";
import { ProjectMetaFields } from "./ProjectMetaFields";
import { ProjectTagInput } from "./ProjectTagInput";
import { useProjectFormMutation } from "@/hooks/use-project-form-mutation";

interface ProjectFormProps {
  initialData?: Project;
  projectId?: string;
}

export function ProjectForm({ initialData, projectId }: ProjectFormProps) {
  const router = useRouter();
  const isEditing = !!projectId;

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
          images: normalizeImagesToGroups(initialData.images ?? []),
          thumbnailImage: initialData.thumbnailImage ?? "",
          liveUrl: initialData.liveUrl ?? "",
          repoUrl: initialData.repoUrl ?? "",
          featured: initialData.featured ?? false,
          displayOrder: initialData.displayOrder ?? 0,
          status: initialData.status ?? "DRAFT",
          startDate: initialData.startDate
            ? (new Date(initialData.startDate).toISOString().split("T")[0] as unknown as Date)
            : undefined,
          endDate: initialData.endDate
            ? (new Date(initialData.endDate).toISOString().split("T")[0] as unknown as Date)
            : undefined,
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

  const mutation = useProjectFormMutation({ projectId });

  return (
    <Card>
      <CardContent className="pt-6">
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values as ProjectCreateInput))}
            className="space-y-4"
          >
            <ProjectMetaFields isEditing={isEditing} />
            <ProjectTagInput initialTags={initialData?.techTags ?? []} />
            <ProjectGallerySection projectId={projectId} />

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : isEditing ? "Update Project" : "Create Project"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/projects")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
