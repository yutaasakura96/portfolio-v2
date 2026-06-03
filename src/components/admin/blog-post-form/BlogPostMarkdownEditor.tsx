"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import { useFormContext, useWatch } from "react-hook-form";
import type { BlogPostFormValues } from "./types";

// Dynamically import the Markdown editor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-muted rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-muted-foreground">Loading editor...</p>
    </div>
  ),
});

/**
 * Markdown body editor wrapped in a card. Reads/writes the `content` field
 * via the form context.
 */
export function BlogPostMarkdownEditor() {
  const form = useFormContext<BlogPostFormValues>();
  const contentValue = useWatch({ control: form.control, name: "content" });

  return (
    <Card>
      <CardContent className="pt-6">
        <Label className="mb-2 block">Content (Markdown)</Label>
        <div data-color-mode="light">
          <MDEditor
            value={contentValue}
            onChange={(val) => form.setValue("content", val || "", { shouldDirty: true })}
            height={500}
            preview="live"
            textareaProps={{
              placeholder:
                "Write your blog post in Markdown...\n\n# Heading\n\nParagraph text here...",
            }}
          />
        </div>
        {form.formState.errors.content && (
          <p className="text-sm text-destructive mt-2">{form.formState.errors.content.message}</p>
        )}
      </CardContent>
    </Card>
  );
}
