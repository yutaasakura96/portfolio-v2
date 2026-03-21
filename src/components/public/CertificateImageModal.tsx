"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";

interface CertificateImageModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null | undefined;
  certName: string;
}

export function CertificateImageModal({
  open,
  onClose,
  imageUrl,
  certName,
}: CertificateImageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{certName}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center bg-gray-100 p-6 min-h-[500px]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${certName} certificate`}
              width={1400}
              height={1000}
              className="object-contain max-h-[80vh] w-full"
              sizes="95vw"
            />
          ) : (
            <p className="text-gray-500 text-sm">No image available</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
