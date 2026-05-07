"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { blogPostCreateSchema } from "@/lib/validations/blog";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch, type Resolver } from "react-hook-form";
import { BlogPostCoverImage } from "./BlogPostCoverImage";
import { BlogPostMarkdownEditor } from "./BlogPostMarkdownEditor";
import { BlogPostMetaFields } from "./BlogPostMetaFields";
import { BlogPostTagInput } from "./BlogPostTagInput";
import type { BlogPostFormValues, BlogPostInitialData } from "./types";
import { useBlogPostFormMutation } from "./useBlogPostFormMutation";

interface BlogPostFormProps {
  initialData?: BlogPostInitialData;
}

export function BlogPostForm({ initialData }: BlogPostFormProps) {
  const isEditing = !!initialData;

  const form = useForm<BlogPostFormValues>({
    // Cast resolver — Zod 4 coerce.date() types its input as `unknown` which
    // creates a mismatch with our explicit BlogPostFormValues type.
    resolver: zodResolver(blogPostCreateSchema) as Resolver<BlogPostFormValues>,
    defaultValues: initialData
      ? {
          title: initialData.title,
          slug: initialData.slug,
          content: initialData.content,
          excerpt: initialData.excerpt,
          featuredImage: initialData.featuredImage || "",
          tags: initialData.tags,
          status: initialData.status,
          publishedAt: initialData.publishedAt ? new Date(initialData.publishedAt) : null,
        }
      : {
          title: "",
          slug: "",
          content: "",
          excerpt: "",
          featuredImage: "",
          tags: [],
          status: "DRAFT" as const,
          publishedAt: null,
        },
  });

  const statusValue = useWatch({ control: form.control, name: "status" });
  const mutation = useBlogPostFormMutation({ postId: initialData?.id });

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data);
  });

  const saveDraft = () => {
    form.setValue("status", "DRAFT");
    onSubmit();
  };

  const publish = () => {
    form.setValue("status", "PUBLISHED");
    onSubmit();
  };

  return (
    <FormProvider {...form}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          <BlogPostMetaFields isEditing={isEditing} />
          <BlogPostMarkdownEditor />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Controls */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold">Publishing</h3>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <Badge variant={statusValue === "PUBLISHED" ? "default" : "secondary"}>
                  {statusValue}
                </Badge>
              </div>

              {initialData?.publishedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Published</span>
                  <span>{new Date(initialData.publishedAt).toLocaleDateString()}</span>
                </div>
              )}

              <Separator />

              <div className="flex flex-col gap-2">
                <Button type="button" onClick={publish} disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : isEditing ? "Update & Publish" : "Publish"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveDraft}
                  disabled={mutation.isPending}
                >
                  {isEditing ? "Save as Draft" : "Save Draft"}
                </Button>
                {isEditing && statusValue === "PUBLISHED" && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      form.setValue("status", "DRAFT");
                      onSubmit();
                    }}
                    disabled={mutation.isPending}
                  >
                    Unpublish
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <BlogPostCoverImage postId={initialData?.id} />
          <BlogPostTagInput />
        </div>
      </div>
    </FormProvider>
  );
}
