"use client";

import { apiClient } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SiteSettingsUpdateInput } from "@/lib/validations/settings";

export type SiteSettings = {
  id: string;
  siteName: string;
  siteDescription: string | null;
  socialLinks: Record<string, string> | null;
  email: string;
  googleAnalyticsId: string | null;
  updatedAt: string;
};

const SETTINGS_KEY = ["settings"] as const;

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => apiClient.getSettings<SiteSettings>(),
    staleTime: 30_000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SiteSettingsUpdateInput) =>
      apiClient.updateSettings<SiteSettingsUpdateInput, SiteSettings>(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
}
