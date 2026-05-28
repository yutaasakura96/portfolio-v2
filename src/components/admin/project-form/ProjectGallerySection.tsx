"use client";

import { GalleryUpload } from "@/components/admin/GalleryUpload";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Label } from "@/components/ui/label";
import type { GalleryImageGroup } from "@/lib/validations/project";
import type { ProjectCreateInput } from "@/lib/validations/project";
import { useFormContext, useWatch } from "react-hook-form";

interface ProjectGallerySectionProps {
  projectId?: string;
}

/**
 * Project image fields: single thumbnail + grouped gallery.
 * Both write into the form context via setValue.
 */
export function ProjectGallerySection({ projectId }: ProjectGallerySectionProps) {
  const form = useFormContext<ProjectCreateInput>();
  const thumbnailImage = useWatch({ control: form.control, name: "thumbnailImage" });
  const images = useWatch({ control: form.control, name: "images" });

  return (
    <>
      <div className="space-y-2">
        <Label>Thumbnail Image</Label>
        <p className="text-xs text-muted-foreground">
          Used on project cards. Recommended: 800×600 or larger.
        </p>
        <ImageUpload
          value={thumbnailImage}
          folder="projects"
          entityId={projectId}
          aspectRatio="aspect-video"
          onUpload={(result) => {
            form.setValue("thumbnailImage", result.urls.large || result.urls.medium, {
              shouldDirty: true,
            });
          }}
          onRemove={() => {
            form.setValue("thumbnailImage", "", { shouldDirty: true });
          }}
        />
        {form.formState.errors.thumbnailImage && (
          <p id="thumbnailImage-error" className="text-sm text-destructive">
            {form.formState.errors.thumbnailImage.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Gallery Images</Label>
        <p className="text-xs text-muted-foreground">
          Screenshots and visuals for the project detail page. Drag to reorder.
        </p>
        <GalleryUpload
          value={(images as GalleryImageGroup[]) || []}
          onChange={(groups) => {
            form.setValue("images", groups, { shouldDirty: true });
          }}
          entityId={projectId}
        />
      </div>
    </>
  );
}
