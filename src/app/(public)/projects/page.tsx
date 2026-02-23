import { ProjectBrowser } from "@/components/public/ProjectBrowser";
import { getPublishedProjects } from "@/lib/data/public-queries";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Browse my portfolio of web development projects featuring React, Next.js, AWS, and more.",
};

export const revalidate = 3600;

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <p className="mt-2 text-gray-600">
          A collection of projects I&apos;ve built, from full-stack applications to developer tools.
        </p>
      </div>
      {/* Temporary fallback for suspense */}
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-gray-100" />}>
        <ProjectBrowser projects={projects} />
      </Suspense>
    </div>
  );
}
