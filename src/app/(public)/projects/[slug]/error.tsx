"use client";

import Link from "next/link";

export default function ProjectError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-24 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Error loading project</h1>
      <p className="mt-4 text-gray-600">Something went wrong. The project may have been removed.</p>
      <div className="mt-8 flex justify-center gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
        >
          Try Again
        </button>
        <Link
          href="/projects"
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
        >
          All Projects
        </Link>
      </div>
    </div>
  );
}
