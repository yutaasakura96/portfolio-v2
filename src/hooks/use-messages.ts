"use client";

import { apiClient } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  pageSize: number;
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
  pageSize?: number;
};

const MESSAGES_KEY = ["messages"] as const;

function filtersToParams(filters?: MessageFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters?.read) params.read = filters.read;
  if (filters?.archived) params.archived = filters.archived;
  if (filters?.sort) params.sort = filters.sort;
  if (filters?.page) params.page = String(filters.page);
  if (filters?.pageSize) params.pageSize = String(filters.pageSize);
  return params;
}

export function useMessages(filters?: MessageFilters) {
  return useQuery({
    queryKey: [...MESSAGES_KEY, filters],
    queryFn: () =>
      apiClient.getMessages<Message, MessagesMeta>(filtersToParams(filters)),
    staleTime: 30_000,
  });
}

export function useMessage(id: string | null) {
  return useQuery({
    queryKey: [...MESSAGES_KEY, id],
    queryFn: () =>
      apiClient.getMessage<Message>(id!).then((res) => res.data),
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
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MESSAGES_KEY });
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
  });
}

export function useUnreadCount() {
  const unreadFilters: MessageFilters = { archived: "false", read: "false", pageSize: 1 };
  return useQuery({
    queryKey: [...MESSAGES_KEY, { archived: "false", read: "false" }],
    queryFn: () =>
      apiClient
        .getMessages<Message, MessagesMeta>(filtersToParams(unreadFilters))
        .then((res) => res.meta.unreadCount),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
