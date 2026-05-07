"use client";

import { ImageUpload } from "@/components/admin/ImageUpload";
import { Card, CardContent } from "@/components/ui/card";
import { useFormContext, useWatch } from "react-hook-form";
import type { BlogPostFormValues } from "./types";

interface BlogPostCoverImageProps {
  postId?: string;
}

/**
 * Featured image upload, scoped to the post id (or "new" while creating).
 */
export function BlogPostCoverImage({ postId }: BlogPostCoverImageProps) {
  const form = useFormContext<BlogPostFormValues>();
  const featuredImage = useWatch({ control: form.control, name: "featuredImage" });

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <h3 className="font-semibold">Featured Image</h3>
        <ImageUpload
          value={featuredImage || undefined}
          folder="blog"
          entityId={postId || "new"}
          aspectRatio="aspect-video"
          placeholder="Upload featured image"
          onUpload={(result) => {
            form.setValue("featuredImage", result.urls.featured || result.urls.original, {
              shouldDirty: true,
            });
          }}
          onRemove={() => {
            form.setValue("featuredImage", "", { shouldDirty: true });
          }}
        />
      </CardContent>
    </Card>
  );
}
