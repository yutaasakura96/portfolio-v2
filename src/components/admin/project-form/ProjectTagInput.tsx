"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectCreateInput } from "@/lib/validations/project";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

interface ProjectTagInputProps {
  initialTags?: string[];
}

/**
 * Comma-separated tech tag input. Splits on blur and writes the array to the
 * `techTags` form field via context.
 */
export function ProjectTagInput({ initialTags }: ProjectTagInputProps) {
  const form = useFormContext<ProjectCreateInput>();
  const [techTagsInput, setTechTagsInput] = useState(initialTags?.join(", ") ?? "");

  const handleTechTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTechTagsInput(e.target.value);
  };

  const handleTechTagsBlur = () => {
    const tags = techTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    form.setValue("techTags", tags, { shouldValidate: true });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="techTags">Tech Tags (comma-separated) *</Label>
      <Input
        id="techTags"
        value={techTagsInput}
        onChange={handleTechTagsChange}
        onBlur={handleTechTagsBlur}
        placeholder="React, TypeScript, AWS"
        aria-invalid={!!form.formState.errors.techTags}
        aria-describedby={form.formState.errors.techTags ? "techTags-error" : undefined}
      />
      {form.formState.errors.techTags && (
        <p id="techTags-error" className="text-sm text-destructive">
          {form.formState.errors.techTags.message}
        </p>
      )}
    </div>
  );
}
