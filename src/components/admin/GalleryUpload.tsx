"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GripVertical, Plus, Trash2, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import type { GalleryImage, GalleryImageGroup } from "@/lib/validations/project";

export type { GalleryImage, GalleryImageGroup };

// Inner component so useDropzone is called at component top-level, not in a loop
interface GroupDropzoneProps {
  isUploading: boolean;
  disabled: boolean;
  onDrop: (files: File[]) => void;
}

function GroupDropzone({ isUploading, disabled, onDrop }: GroupDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) onDrop(acceptedFiles);
    },
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
    },
    disabled: disabled || isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400 bg-gray-50",
        isUploading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-gray-600">Uploading...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <Plus className="h-5 w-5 text-gray-400" />
          <p className="text-sm text-gray-600">
            {isDragActive ? "Drop images here" : "Add images to group"}
          </p>
          <p className="text-xs text-gray-400">Drag & drop or click • Multiple files allowed</p>
        </div>
      )}
    </div>
  );
}

interface GalleryUploadProps {
  value: GalleryImageGroup[];
  onChange: (groups: GalleryImageGroup[]) => void;
  entityId?: string;
  disabled?: boolean;
}

export function GalleryUpload({ value, onChange, entityId, disabled = false }: GalleryUploadProps) {
  const [uploadingGroup, setUploadingGroup] = useState<number | null>(null);

  const handleUpload = useCallback(
    async (files: File[], groupIndex: number) => {
      setUploadingGroup(groupIndex);

      try {
        const uploadPromises = files.map(async (file) => {
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(`${file.name} exceeds 10MB limit`);
          }

          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "projects");
          if (entityId) {
            formData.append("entityId", entityId);
          }

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Upload failed");
          }

          const result = await response.json();
          return result.data;
        });

        const results = await Promise.all(uploadPromises);

        const currentImages = value[groupIndex]?.images ?? [];
        const newImages: GalleryImage[] = results.map((result, index) => ({
          url: result.urls.large || result.urls.original,
          alt: "",
          order: currentImages.length + index,
        }));

        const updatedGroups = value.map((g, gi) =>
          gi === groupIndex ? { ...g, images: [...g.images, ...newImages] } : g
        );
        onChange(updatedGroups);
        toast.success(`${results.length} image(s) uploaded`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        toast.error(message);
      } finally {
        setUploadingGroup(null);
      }
    },
    [entityId, value, onChange]
  );

  // Group-level operations
  const addGroup = () => {
    onChange([...value, { name: "", images: [] }]);
  };

  const removeGroup = (gi: number) => {
    onChange(value.filter((_, i) => i !== gi));
  };

  const updateGroupName = (gi: number, name: string) => {
    onChange(value.map((g, i) => (i === gi ? { ...g, name } : g)));
  };

  const moveGroup = (gi: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? gi - 1 : gi + 1;
    if (toIndex < 0 || toIndex >= value.length) return;
    const updated = [...value];
    [updated[gi], updated[toIndex]] = [updated[toIndex], updated[gi]];
    onChange(updated);
  };

  // Image-level operations scoped to a group
  const removeImage = (gi: number, ii: number) => {
    onChange(
      value.map((g, groupIdx) =>
        groupIdx === gi
          ? {
              ...g,
              images: g.images
                .filter((_, imgIdx) => imgIdx !== ii)
                .map((img, idx) => ({ ...img, order: idx })),
            }
          : g
      )
    );
  };

  const updateAlt = (gi: number, ii: number, alt: string) => {
    onChange(
      value.map((g, groupIdx) =>
        groupIdx === gi
          ? {
              ...g,
              images: g.images.map((img, imgIdx) => (imgIdx === ii ? { ...img, alt } : img)),
            }
          : g
      )
    );
  };

  const moveImage = (gi: number, ii: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? ii - 1 : ii + 1;
    const group = value[gi];
    if (toIndex < 0 || toIndex >= group.images.length) return;
    const imgs = [...group.images];
    [imgs[ii], imgs[toIndex]] = [imgs[toIndex], imgs[ii]];
    onChange(
      value.map((g, groupIdx) =>
        groupIdx === gi ? { ...g, images: imgs.map((img, idx) => ({ ...img, order: idx })) } : g
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Group cards */}
      {value.map((group, gi) => (
        <div key={gi} className="border rounded-lg p-4 space-y-3 bg-white">
          {/* Group header */}
          <div className="flex items-center gap-2">
            {/* Group reorder */}
            <div className="flex flex-col gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveGroup(gi, "up")}
                disabled={gi === 0 || disabled}
              >
                <GripVertical className="h-3 w-3 rotate-90" />
                <span className="sr-only">Move group up</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveGroup(gi, "down")}
                disabled={gi === value.length - 1 || disabled}
              >
                <GripVertical className="h-3 w-3 -rotate-90" />
                <span className="sr-only">Move group down</span>
              </Button>
            </div>

            {/* Group name input */}
            <Input
              placeholder="Group name (e.g. Desktop, Mobile Views)"
              value={group.name}
              onChange={(e) => updateGroupName(gi, e.target.value)}
              className="flex-1 font-medium"
              disabled={disabled}
            />

            {/* Delete group */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
              onClick={() => removeGroup(gi)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remove group</span>
            </Button>
          </div>

          {/* Images in this group */}
          {group.images.length > 0 && (
            <div className="space-y-2 pl-10">
              {group.images.map((img, ii) => (
                <div
                  key={`${img.url}-${ii}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                >
                  {/* Image reorder controls */}
                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveImage(gi, ii, "up")}
                      disabled={ii === 0 || disabled}
                    >
                      <GripVertical className="h-3 w-3 rotate-90" />
                      <span className="sr-only">Move up</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveImage(gi, ii, "down")}
                      disabled={ii === group.images.length - 1 || disabled}
                    >
                      <GripVertical className="h-3 w-3 -rotate-90" />
                      <span className="sr-only">Move down</span>
                    </Button>
                  </div>

                  {/* Image preview */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        title="Click to preview"
                        className="relative h-16 w-24 shrink-0 overflow-hidden rounded bg-gray-100 group/preview block cursor-pointer"
                      >
                        <Image
                          src={img.url}
                          alt={img.alt || "Gallery image"}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl p-2">
                      <DialogTitle className="sr-only">Image preview</DialogTitle>
                      <div className="relative w-full h-[80vh]">
                        <Image
                          src={img.url}
                          alt={img.alt || "Gallery image"}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 75vw"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Alt text */}
                  <Input
                    placeholder="Alt text for accessibility"
                    value={img.alt}
                    onChange={(e) => updateAlt(gi, ii, e.target.value)}
                    className="flex-1"
                    disabled={disabled}
                  />

                  {/* Delete image */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeImage(gi, ii)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Per-group dropzone */}
          <div className="pl-10">
            <GroupDropzone
              isUploading={uploadingGroup === gi}
              disabled={disabled}
              onDrop={(files) => handleUpload(files, gi)}
            />
          </div>
        </div>
      ))}

      {/* Add Group button */}
      <Button
        type="button"
        variant="outline"
        onClick={addGroup}
        disabled={disabled}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Group
      </Button>
    </div>
  );
}
