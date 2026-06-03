"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  useBulkUpdateMessages,
  useDeleteMessage,
  useMessages,
  useUpdateMessage,
  type Message,
  type MessageFilters,
} from "@/hooks/use-messages";
import { formatDistanceToNow } from "date-fns";
import { ImportExportToolbar } from "@/components/admin/ImportExportToolbar";
import { entityConfigs } from "@/lib/import-export";
import { cn } from "@/lib/utils";
import {
  Archive,
  ArchiveRestore,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MailOpen,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Tab = "inbox" | "archived";

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("inbox");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filters: MessageFilters = {
    archived: activeTab === "archived" ? "true" : "false",
    sort: "newest",
    page,
    limit: 20,
  };

  const { data, isLoading, isError } = useMessages(filters);
  const updateMessage = useUpdateMessage();
  const deleteMessage = useDeleteMessage();
  const bulkUpdate = useBulkUpdateMessages();

  const messages = data?.data ?? [];
  const meta = data?.meta;

  // ── Tab switch ─────────────────────────────────────
  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setPage(1);
    setSelected(new Set());
    setExpandedId(null);
  }

  // ── Selection ──────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === messages.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(messages.map((m) => m.id)));
    }
  }

  // ── Row expand ─────────────────────────────────────
  function handleRowClick(msg: Message) {
    const isExpanding = expandedId !== msg.id;
    setExpandedId(isExpanding ? msg.id : null);

    if (isExpanding && !msg.read) {
      updateMessage.mutate({ id: msg.id, data: { read: true } });
    }
  }

  // ── Bulk actions ───────────────────────────────────
  function bulkMarkRead(read: boolean) {
    bulkUpdate.mutate(
      { ids: Array.from(selected), update: { read } },
      {
        onSuccess: () => {
          setSelected(new Set());
          toast.success(read ? "Marked as read" : "Marked as unread");
        },
        onError: () => toast.error("Failed to update messages"),
      }
    );
  }

  function bulkArchive(archived: boolean) {
    bulkUpdate.mutate(
      { ids: Array.from(selected), update: { archived } },
      {
        onSuccess: () => {
          setSelected(new Set());
          toast.success(archived ? "Messages archived" : "Messages restored");
        },
        onError: () => toast.error("Failed to update messages"),
      }
    );
  }

  // ── Delete ─────────────────────────────────────────
  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMessage.mutate(deleteTarget, {
      onSuccess: () => {
        setDeleteTarget(null);
        if (expandedId === deleteTarget) setExpandedId(null);
        toast.success("Message deleted");
      },
      onError: () => toast.error("Failed to delete message"),
    });
  }

  // ── Loading / error ────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center text-sm text-destructive">
        Failed to load messages. Please try refreshing the page.
      </div>
    );
  }

  const allSelected = messages.length > 0 && selected.size === messages.length;
  const someSelected = selected.size > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contact form submissions from visitors.
          </p>
        </div>
        <ImportExportToolbar
          entity="messages"
          entityLabel="Messages"
          entityConfig={entityConfigs.messages}
          queryKey={["messages"]}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["inbox", "archived"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium capitalize transition-colors",
              activeTab === tab
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
            {tab === "inbox" && meta && meta.unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-destructive px-1.5 py-0.5 text-[11px] font-semibold text-destructive-foreground">
                {meta.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium text-primary">{selected.size} selected</span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => bulkMarkRead(true)}
              disabled={bulkUpdate.isPending}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              <MailOpen className="h-3.5 w-3.5" />
              Mark read
            </button>
            <button
              onClick={() => bulkMarkRead(false)}
              disabled={bulkUpdate.isPending}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              <Mail className="h-3.5 w-3.5" />
              Mark unread
            </button>
            {activeTab === "inbox" ? (
              <button
                onClick={() => bulkArchive(true)}
                disabled={bulkUpdate.isPending}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                <Archive className="h-3.5 w-3.5" />
                Archive
              </button>
            ) : (
              <button
                onClick={() => bulkArchive(false)}
                disabled={bulkUpdate.isPending}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                <ArchiveRestore className="h-3.5 w-3.5" />
                Unarchive
              </button>
            )}
          </div>
        </div>
      )}

      {/* Message list */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {messages.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {activeTab === "inbox" ? "No messages in your inbox." : "No archived messages."}
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-input text-foreground"
              />
              <span>Select all</span>
            </div>

            {/* Rows */}
            {messages.map((msg) => {
              const isExpanded = expandedId === msg.id;
              const isChecked = selected.has(msg.id);

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "border-b border-border last:border-0",
                    !msg.read ? "bg-accent/50" : "bg-card"
                  )}
                >
                  {/* Summary row */}
                  <div
                    className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted"
                    onClick={() => handleRowClick(msg)}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(msg.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(msg.id)}
                        className="h-4 w-4 rounded border-input text-foreground"
                      />
                    </div>

                    {/* Unread dot */}
                    <div className="flex w-2 shrink-0 items-center justify-center">
                      {!msg.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm",
                            !msg.read
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground"
                          )}
                        >
                          {msg.name}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {msg.subject || "(no subject)"}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {msg.message.slice(0, 100)}
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted px-4 py-4">
                      <dl className="space-y-3 text-sm">
                        <div>
                          <dt className="font-medium text-muted-foreground">From</dt>
                          <dd className="mt-0.5 text-foreground">
                            {msg.name}{" "}
                            <a
                              href={`mailto:${msg.email}`}
                              className="text-primary hover:underline"
                            >
                              &lt;{msg.email}&gt;
                            </a>
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-muted-foreground">Subject</dt>
                          <dd className="mt-0.5 text-foreground">
                            {msg.subject || "(no subject)"}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-muted-foreground">Message</dt>
                          <dd className="mt-0.5 whitespace-pre-wrap text-foreground">
                            {msg.message}
                          </dd>
                        </div>
                      </dl>

                      {/* Action buttons */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <a
                          href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || "")}`}
                          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Reply via Email
                        </a>

                        {activeTab === "inbox" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateMessage.mutate({ id: msg.id, data: { archived: true } });
                            }}
                            disabled={updateMessage.isPending}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                          >
                            <Archive className="h-3.5 w-3.5" />
                            Archive
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateMessage.mutate({ id: msg.id, data: { archived: false } });
                            }}
                            disabled={updateMessage.isPending}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                          >
                            <ArchiveRestore className="h-3.5 w-3.5" />
                            Unarchive
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(msg.id);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-destructive/50 bg-card px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {meta.page} of {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={meta.page >= meta.totalPages}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete message"
        description="Are you sure you want to permanently delete this message? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteMessage.isPending}
      />
    </div>
  );
}
