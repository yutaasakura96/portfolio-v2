"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateSlug } from "@/lib/utils/slug";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { BlogPostFormValues } from "./types";

interface BlogPostMetaFieldsProps {
  isEditing: boolean;
}

/**
 * Title + slug + excerpt fields. Auto-generates slug from title until the
 * slug input is manually edited (and only when creating a new post).
 */
export function BlogPostMetaFields({ isEditing }: BlogPostMetaFieldsProps) {
  const form = useFormContext<BlogPostFormValues>();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const titleValue = useWatch({ control: form.control, name: "title" });

  useEffect(() => {
    if (!slugManuallyEdited && !isEditing && titleValue) {
      form.setValue("slug", generateSlug(titleValue));
    }
  }, [titleValue, slugManuallyEdited, isEditing, form]);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="My Awesome Blog Post" {...form.register("title")} />
          {form.formState.errors.title && (
            <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
          )}
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">/blog/</span>
            <Input
              id="slug"
              placeholder="my-awesome-blog-post"
              {...form.register("slug")}
              onChange={(e) => {
                form.setValue("slug", e.target.value);
                setSlugManuallyEdited(true);
              }}
            />
          </div>
          {form.formState.errors.slug && (
            <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
          )}
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            placeholder="A brief summary shown on blog listing cards..."
            rows={3}
            {...form.register("excerpt")}
          />
          {form.formState.errors.excerpt && (
            <p className="text-sm text-red-500">{form.formState.errors.excerpt.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
