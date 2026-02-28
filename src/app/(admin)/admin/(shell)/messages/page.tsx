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
    pageSize: 20,
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
      next.has(id) ? next.delete(id) : next.add(id);
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
      { onSuccess: () => setSelected(new Set()) }
    );
  }

  function bulkArchive(archived: boolean) {
    bulkUpdate.mutate(
      { ids: Array.from(selected), update: { archived } },
      { onSuccess: () => setSelected(new Set()) }
    );
  }

  // ── Delete ─────────────────────────────────────────
  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMessage.mutate(deleteTarget, {
      onSuccess: () => {
        setDeleteTarget(null);
        if (expandedId === deleteTarget) setExpandedId(null);
      },
    });
  }

  // ── Loading / error ────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center text-sm text-red-600">
        Failed to load messages. Please try refreshing the page.
      </div>
    );
  }

  const allSelected = messages.length > 0 && selected.size === messages.length;
  const someSelected = selected.size > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 text-sm text-gray-500">Contact form submissions from visitors.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["inbox", "archived"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
            {tab === "inbox" && meta && meta.unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {meta.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
          <span className="text-sm font-medium text-blue-700">
            {selected.size} selected
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => bulkMarkRead(true)}
              disabled={bulkUpdate.isPending}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-50"
            >
              <MailOpen className="h-3.5 w-3.5" />
              Mark read
            </button>
            <button
              onClick={() => bulkMarkRead(false)}
              disabled={bulkUpdate.isPending}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-50"
            >
              <Mail className="h-3.5 w-3.5" />
              Mark unread
            </button>
            {activeTab === "inbox" ? (
              <button
                onClick={() => bulkArchive(true)}
                disabled={bulkUpdate.isPending}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-50"
              >
                <Archive className="h-3.5 w-3.5" />
                Archive
              </button>
            ) : (
              <button
                onClick={() => bulkArchive(false)}
                disabled={bulkUpdate.isPending}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-50"
              >
                <ArchiveRestore className="h-3.5 w-3.5" />
                Unarchive
              </button>
            )}
          </div>
        </div>
      )}

      {/* Message list */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {messages.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            {activeTab === "inbox" ? "No messages in your inbox." : "No archived messages."}
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-2 text-xs font-medium text-gray-500">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-gray-900"
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
                  className={`border-b border-gray-100 last:border-0 ${
                    !msg.read ? "bg-blue-50/50" : "bg-white"
                  }`}
                >
                  {/* Summary row */}
                  <div
                    className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50"
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
                        className="h-4 w-4 rounded border-gray-300 text-gray-900"
                      />
                    </div>

                    {/* Unread dot */}
                    <div className="flex w-2 shrink-0 items-center justify-center">
                      {!msg.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`text-sm ${!msg.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                          {msg.name}
                        </span>
                        <span className="shrink-0 text-xs text-gray-400">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">{msg.subject || "(no subject)"}</div>
                      <div className="truncate text-xs text-gray-400">
                        {msg.message.slice(0, 100)}
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                      <dl className="space-y-3 text-sm">
                        <div>
                          <dt className="font-medium text-gray-500">From</dt>
                          <dd className="mt-0.5 text-gray-900">
                            {msg.name}{" "}
                            <a href={`mailto:${msg.email}`} className="text-blue-600 hover:underline">
                              &lt;{msg.email}&gt;
                            </a>
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-500">Subject</dt>
                          <dd className="mt-0.5 text-gray-900">{msg.subject || "(no subject)"}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-500">Message</dt>
                          <dd className="mt-0.5 whitespace-pre-wrap text-gray-900">{msg.message}</dd>
                        </div>
                      </dl>

                      {/* Action buttons */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <a
                          href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || "")}`}
                          className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
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
                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
                          className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
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
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {meta.page} of {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={meta.page >= meta.totalPages}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-40"
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
