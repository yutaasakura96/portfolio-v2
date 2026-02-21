"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function LoginContent() {
  const { signIn, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // If already authenticated, redirect to admin
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/admin");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Sign in to manage your portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
              {error === "auth_failed"
                ? "Authentication failed. Please try again."
                : `Login error: ${error}`}
            </div>
          )}
          <Button onClick={signIn} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? "Checking session..." : "Sign In with Cognito"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}
    >
      <LoginContent />
    </Suspense>
  );
}
