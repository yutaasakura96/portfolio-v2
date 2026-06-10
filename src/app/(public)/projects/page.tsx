import { LocalizedUi } from "@/components/public/LocalizedContent";
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
        <LocalizedUi
          k="projects"
          as="h1"
          className="text-3xl font-bold text-foreground sm:text-4xl"
        />
        <LocalizedUi
          k="projectsPageDescription"
          as="p"
          className="mt-3 text-muted-foreground max-w-lg"
        />
      </div>
      {/* Temporary fallback for suspense */}
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
        <ProjectBrowser projects={projects} />
      </Suspense>
    </div>
  );
}
