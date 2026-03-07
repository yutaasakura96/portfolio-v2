"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download } from "lucide-react";

interface ResumeModalProps {
  open: boolean;
  onClose: () => void;
  resumeUrl: string;
}

export function ResumeModal({ open, onClose, resumeUrl }: ResumeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-5xl sm:max-w-5xl h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b shrink-0 pr-14">
          <DialogTitle>Resume</DialogTitle>
          <a
            href="/api/resume/download"
            download="resume.pdf"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </DialogHeader>
        <iframe
          src={resumeUrl}
          className="flex-1 w-full"
          title="Resume preview"
        />
      </DialogContent>
    </Dialog>
  );
}
