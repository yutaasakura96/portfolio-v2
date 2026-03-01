"use client";

import { apiClient } from "@/lib/api-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiClient.getMe(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const signIn = useCallback(() => {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

    if (!domain || !clientId) {
      throw new Error(
        "Missing NEXT_PUBLIC_COGNITO_DOMAIN or NEXT_PUBLIC_COGNITO_CLIENT_ID in environment variables"
      );
    }

    const redirectUri = `${window.location.origin}/api/auth/callback`;
    const cognitoLoginUrl =
      `https://${domain}/login` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&scope=openid+email+profile` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = cognitoLoginUrl;
  }, []);

  const signOut = useCallback(async () => {
    await apiClient.signOut();
    queryClient.clear();
    router.push("/admin/login");
  }, [queryClient, router]);

  return {
    user: data?.data ?? null,
    isLoading,
    isAuthenticated: !!data?.data,
    signIn,
    signOut,
  };
}
