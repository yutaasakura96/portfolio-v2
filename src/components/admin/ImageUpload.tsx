"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, ImageIcon, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadedImage {
  urls: Record<string, string>;
  key: string;
}

interface ImageUploadProps {
  /** Current image URL (for displaying existing images) */
  value?: string;
  /** Callback when image is uploaded successfully */
  onUpload: (result: UploadedImage) => void;
  /** Callback when image is removed */
  onRemove?: () => void;
  /** S3 folder for the upload */
  folder: "projects" | "blog" | "profile" | "logos" | "certifications" | "resume";
  /** Entity ID for subfolder organization */
  entityId?: string;
  /** Custom placeholder text */
  placeholder?: string;
  /** Aspect ratio class for preview (e.g., "aspect-video", "aspect-square") */
  aspectRatio?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Accepted file types */
  accept?: Record<string, string[]>;
}

const DEFAULT_ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

export function ImageUpload({
  value,
  onUpload,
  onRemove,
  folder,
  entityId,
  placeholder = "Drag & drop an image here, or click to browse",
  aspectRatio = "aspect-video",
  disabled = false,
  accept = DEFAULT_ACCEPT,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = useCallback(
    async (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);
        if (entityId) {
          formData.append("entityId", entityId);
        }

        // Use XMLHttpRequest for progress tracking
        const result = await new Promise<UploadedImage>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              resolve(response.data);
            } else {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error?.message || "Upload failed"));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Network error")));

          xhr.open("POST", "/api/upload");
          xhr.send(formData);
        });

        onUpload(result);
        toast.success("Image uploaded successfully");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        toast.error(message);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [folder, entityId, onUpload]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  const handleRemove = async () => {
    if (onRemove) {
      onRemove();
    }
  };

  // Show existing image or file placeholder
  if (value && !isUploading) {
    const isImageUrl =
      (value.startsWith("http://") || value.startsWith("https://")) &&
      !value.toLowerCase().endsWith(".pdf");

    return (
      <div className="relative group">
        <div
          className={cn(
            "relative overflow-hidden rounded-lg bg-gray-100 border",
            aspectRatio,
            !isImageUrl && "flex flex-col items-center justify-center gap-2"
          )}
        >
          {isImageUrl ? (
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <>
              <FileText className="h-10 w-10 text-gray-400" />
              <p className="text-sm text-gray-500">File uploaded</p>
            </>
          )}
        </div>
        {onRemove && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // Show upload area
  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed rounded-lg transition-colors cursor-pointer",
        aspectRatio,
        "flex flex-col items-center justify-center gap-2 p-6",
        isDragActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400 bg-gray-50",
        (disabled || isUploading) && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />

      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <>
          {isDragActive ? (
            <Upload className="h-8 w-8 text-blue-500" />
          ) : (
            <ImageIcon className="h-8 w-8 text-gray-400" />
          )}
          <p className="text-sm text-gray-600 text-center">{placeholder}</p>
          <p className="text-xs text-gray-400">JPEG, PNG, WebP, GIF • Max 10MB</p>
        </>
      )}
    </div>
  );
}
