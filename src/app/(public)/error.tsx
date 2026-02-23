"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Public page error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-24 text-center">
      <p className="text-sm font-semibold text-red-500">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900">Unexpected Error</h1>
      <p className="mt-4 text-gray-600">
        An error occurred while loading this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
