"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DocumentModalProps {
  open: boolean;
  onClose: () => void;
  documentUrl: string;
}

export function DocumentModal({ open, onClose, documentUrl }: DocumentModalProps) {
  const src = documentUrl.toLowerCase().endsWith(".pdf") ? `${documentUrl}#toolbar=0` : documentUrl;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-5xl sm:max-w-5xl h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>Credentials</DialogTitle>
        </DialogHeader>
        <iframe src={src} className="flex-1 w-full" title="Document preview" />
      </DialogContent>
    </Dialog>
  );
}
