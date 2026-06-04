import { ProjectBrowser } from "@/components/public/ProjectBrowser";
import { getPublishedProjects } from "@/lib/data/public-queries";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Portfolio projects by Yuta Asakura — full-stack web applications built with Next.js, TypeScript, AWS, and more.",
};

export const revalidate = 60;

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <div className="mb-10">
        <p className="text-sm font-medium text-[var(--accent-signature)] mb-1">Portfolio</p>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Projects</h1>
        <p className="mt-3 text-muted-foreground max-w-lg">
          A collection of projects I&apos;ve built, from full-stack applications to developer tools.
        </p>
      </div>
      {/* Temporary fallback for suspense */}
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
        <ProjectBrowser projects={projects} />
      </Suspense>
    </div>
  );
}
