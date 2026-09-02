"use client";

import { apiClient } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  archived: boolean;
  createdAt: string;
};

export type MessagesMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
};

export type MessagesResponse = {
  data: Message[];
  meta: MessagesMeta;
};

export type MessageFilters = {
  read?: "all" | "true" | "false";
  archived?: "true" | "false";
  sort?: "newest" | "oldest";
  page?: number;
  limit?: number;
};

const MESSAGES_KEY = ["messages"] as const;

function filtersToParams(filters?: MessageFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters?.read) params.read = filters.read;
  if (filters?.archived) params.archived = filters.archived;
  if (filters?.sort) params.sort = filters.sort;
  if (filters?.page) params.page = String(filters.page);
  if (filters?.limit) params.limit = String(filters.limit);
  return params;
}

export function useMessages(filters?: MessageFilters) {
  return useQuery({
    queryKey: [...MESSAGES_KEY, filters],
    queryFn: () => apiClient.getMessages<Message, MessagesMeta>(filtersToParams(filters)),
    staleTime: 30_000,
  });
}

export function useMessage(id: string | null) {
  return useQuery({
    queryKey: [...MESSAGES_KEY, id],
    queryFn: () => apiClient.getMessage<Message>(id!).then((res) => res.data),
    enabled: !!id,
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { read?: boolean; archived?: boolean } }) =>
      apiClient.updateMessage<{ read?: boolean; archived?: boolean }, Message>(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MESSAGES_KEY });
    },
    onError: () => {
      toast.error("Failed to update message");
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MESSAGES_KEY });
    },
    onError: () => {
      toast.error("Failed to delete message");
    },
  });
}

export function useBulkUpdateMessages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { ids: string[]; update: { read?: boolean; archived?: boolean } }) =>
      apiClient.bulkUpdateMessages<
        { ids: string[]; update: { read?: boolean; archived?: boolean } },
        { count: number }
      >(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MESSAGES_KEY });
    },
    onError: () => {
      toast.error("Failed to update messages");
    },
  });
}

/**
 * Unread-message count for the sidebar badge.
 *
 * Deliberately has **no `refetchInterval`**. This hook is mounted in
 * `AdminSidebar`, which lives in the admin shell layout — so it runs on every
 * admin page, not just the messages page. `GET /api/messages` costs three
 * Prisma queries even at `limit=1`, so a 60s poll kept the Neon compute awake
 * indefinitely whenever an admin tab was left open (Neon only scales to zero
 * after 5 idle minutes). The badge now refreshes on window focus and on mount
 * via the TanStack Query defaults in `QueryProvider`, which is accurate enough
 * for a single-admin CMS. Do not reintroduce a short interval here.
 */
export function useUnreadCount() {
  const unreadFilters: MessageFilters = { archived: "false", read: "false", limit: 1 };
  return useQuery({
    queryKey: [...MESSAGES_KEY, { archived: "false", read: "false" }],
    queryFn: () =>
      apiClient
        .getMessages<Message, MessagesMeta>(filtersToParams(unreadFilters))
        .then((res) => res.meta.unreadCount),
    staleTime: 30_000,
  });
}
