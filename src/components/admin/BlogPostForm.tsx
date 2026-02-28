"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { X } from "lucide-react";
import { blogPostCreateSchema } from "@/lib/validations/blog";
import { generateSlug } from "@/lib/utils/slug";
import { apiClient } from "@/lib/api-client";

// Dynamically import the Markdown editor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-gray-400">Loading editor...</p>
    </div>
  ),
});

// Explicit form type — avoids Zod 4 coerce.date() input/output mismatch with react-hook-form
type BlogPostFormValues = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  publishedAt: Date | null;
};

interface BlogPostFormProps {
  initialData?: {
    id: string;
    slug: string;
    title: string;
    content: string;
    excerpt: string;
    featuredImage: string | null;
    tags: string[];
    status: "DRAFT" | "PUBLISHED";
    publishedAt: string | null;
  };
}

export function BlogPostForm({ initialData }: BlogPostFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [tagInput, setTagInput] = useState("");

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

  // Auto-generate slug from title (only if slug hasn't been manually edited)
  const titleValue = form.watch("title");
  useEffect(() => {
    if (!slugManuallyEdited && !isEditing && titleValue) {
      form.setValue("slug", generateSlug(titleValue));
    }
  }, [titleValue, slugManuallyEdited, isEditing, form]);

  // Tag management
  const tags = form.watch("tags") || [];
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      form.setValue("tags", [...tags, tag], { shouldDirty: true });
      setTagInput("");
    }
  };
  const removeTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      tags.filter((t) => t !== tagToRemove),
      { shouldDirty: true }
    );
  };

  const mutation = useMutation({
    mutationFn: async (data: BlogPostFormValues) => {
      const payload = data as Record<string, unknown>;
      if (isEditing) {
        return apiClient.updateBlogPost(initialData.id, payload);
      }
      return apiClient.createBlogPost(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
      toast.success(isEditing ? "Post updated" : "Post created");
      router.push("/admin/blog");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to save post";
      toast.error(message);
    },
  });

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content area */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="My Awesome Blog Post"
                {...form.register("title")}
              />
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

        {/* Markdown Editor */}
        <Card>
          <CardContent className="pt-6">
            <Label className="mb-2 block">Content (Markdown)</Label>
            <div data-color-mode="light">
              <MDEditor
                value={form.watch("content")}
                onChange={(val) =>
                  form.setValue("content", val || "", { shouldDirty: true })
                }
                height={500}
                preview="live"
                textareaProps={{
                  placeholder:
                    "Write your blog post in Markdown...\n\n# Heading\n\nParagraph text here...",
                }}
              />
            </div>
            {form.formState.errors.content && (
              <p className="text-sm text-red-500 mt-2">
                {form.formState.errors.content.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Publish Controls */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold">Publishing</h3>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <Badge variant={form.watch("status") === "PUBLISHED" ? "default" : "secondary"}>
                {form.watch("status")}
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
                {mutation.isPending
                  ? "Saving..."
                  : isEditing
                    ? "Update & Publish"
                    : "Publish"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={saveDraft}
                disabled={mutation.isPending}
              >
                {isEditing ? "Save as Draft" : "Save Draft"}
              </Button>
              {isEditing && form.watch("status") === "PUBLISHED" && (
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

        {/* Featured Image */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h3 className="font-semibold">Featured Image</h3>
            <ImageUpload
              value={form.watch("featuredImage") || undefined}
              folder="blog"
              entityId={initialData?.id || "new"}
              aspectRatio="aspect-video"
              placeholder="Upload featured image"
              onUpload={(result) => {
                form.setValue(
                  "featuredImage",
                  result.urls.featured || result.urls.original,
                  { shouldDirty: true }
                );
              }}
              onRemove={() => {
                form.setValue("featuredImage", "", { shouldDirty: true });
              }}
            />
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h3 className="font-semibold">Tags</h3>

            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
