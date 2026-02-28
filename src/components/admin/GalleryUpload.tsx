"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  url: string;
  alt: string;
  order: number;
}

interface GalleryUploadProps {
  value: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  entityId?: string;
  disabled?: boolean;
}

export function GalleryUpload({
  value,
  onChange,
  entityId,
  disabled = false,
}: GalleryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = useCallback(
    async (files: File[]) => {
      setIsUploading(true);

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

        // Add new images to the gallery with order
        const newImages: GalleryImage[] = results.map((result, index) => ({
          url: result.urls.large || result.urls.original,
          alt: "",
          order: value.length + index,
        }));

        onChange([...value, ...newImages]);
        toast.success(`${results.length} image(s) uploaded`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        toast.error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [entityId, value, onChange]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleUpload(acceptedFiles);
      }
    },
    [handleUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
    },
    disabled: disabled || isUploading,
  });

  const removeImage = (index: number) => {
    const updated = value.filter((_, i) => i !== index).map((img, i) => ({
      ...img,
      order: i,
    }));
    onChange(updated);
  };

  const updateAlt = (index: number, alt: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], alt };
    onChange(updated);
  };

  const moveImage = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= value.length) return;

    const updated = [...value];
    [updated[fromIndex], updated[toIndex]] = [updated[toIndex], updated[fromIndex]];
    onChange(updated.map((img, i) => ({ ...img, order: i })));
  };

  return (
    <div className="space-y-4">
      {/* Existing images */}
      {value.length > 0 && (
        <div className="space-y-3">
          {value.map((img, index) => (
            <div
              key={`${img.url}-${index}`}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border"
            >
              {/* Reorder controls */}
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveImage(index, "up")}
                  disabled={index === 0}
                >
                  <GripVertical className="h-3 w-3 rotate-90" />
                  <span className="sr-only">Move up</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveImage(index, "down")}
                  disabled={index === value.length - 1}
                >
                  <GripVertical className="h-3 w-3 -rotate-90" />
                  <span className="sr-only">Move down</span>
                </Button>
              </div>

              {/* Image preview */}
              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                <Image
                  src={img.url}
                  alt={img.alt || "Gallery image"}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>

              {/* Alt text input */}
              <Input
                placeholder="Alt text for accessibility"
                value={img.alt}
                onChange={(e) => updateAlt(index, e.target.value)}
                className="flex-1"
              />

              {/* Delete */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => removeImage(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 bg-gray-50",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Plus className="h-6 w-6 text-gray-400" />
            <p className="text-sm text-gray-600">
              {isDragActive ? "Drop images here" : "Add gallery images"}
            </p>
            <p className="text-xs text-gray-400">Drag & drop or click • Multiple files allowed</p>
          </div>
        )}
      </div>
    </div>
  );
}
