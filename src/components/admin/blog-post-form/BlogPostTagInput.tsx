"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { BlogPostFormValues } from "./types";

/**
 * Tag editor — type a tag, press Enter or click Add. Removes via the X badge.
 * Backed by the `tags: string[]` form field.
 */
export function BlogPostTagInput() {
  const form = useFormContext<BlogPostFormValues>();
  const [tagInput, setTagInput] = useState("");
  const tags = useWatch({ control: form.control, name: "tags" }) || [];

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

  return (
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
  );
}
