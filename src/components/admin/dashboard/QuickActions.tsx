"use client";

import { Mail, Plus } from "lucide-react";
import Link from "next/link";

type QuickActionsProps = {
  messageCount: number;
};

export function QuickActions({ messageCount }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/admin/projects/new"
        className="pressable inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" /> New Project
      </Link>
      <Link
        href="/admin/blog/new"
        className="pressable inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" /> New Post
      </Link>
      {messageCount > 0 && (
        <Link
          href="/admin/messages"
          className="pressable inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-muted"
        >
          <Mail className="h-4 w-4" /> View Messages
          <span className="rounded-full bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground tabular-nums">
            {messageCount}
          </span>
        </Link>
      )}
    </div>
  );
}
