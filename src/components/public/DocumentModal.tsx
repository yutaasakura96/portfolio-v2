"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface DocumentModalProps {
  open: boolean;
  onClose: () => void;
  documentUrl: string;
}

export function DocumentModal({ open, onClose, documentUrl }: DocumentModalProps) {
  const isPdf = documentUrl.toLowerCase().endsWith(".pdf");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 p-0 overflow-hidden",
          isPdf ? "w-[90vw] max-w-4xl h-[80vh]" : "w-auto max-w-3xl"
        )}
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>Credentials</DialogTitle>
        </DialogHeader>
        {isPdf ? (
          <iframe
            src={`${documentUrl}#toolbar=0`}
            className="flex-1 w-full"
            title="Document preview"
          />
        ) : (
          <div className="flex items-center justify-center bg-muted p-4">
            <Image
              src={documentUrl}
              alt="Credential document"
              width={1000}
              height={700}
              className="object-contain max-h-[60vh] w-auto"
              sizes="(max-width: 768px) 90vw, 48rem"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
