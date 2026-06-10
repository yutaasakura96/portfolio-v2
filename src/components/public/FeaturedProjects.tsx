"use client";

import { ProjectCard } from "@/components/public/ProjectCard";
import { useLocale } from "@/hooks/use-locale";
import { useReveal } from "@/hooks/use-reveal";
import { ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface FeaturedProject {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  techTags: string[];
  thumbnailImage: string;
  liveUrl: string | null;
  repoUrl: string | null;
  titleJa: string | null;
  shortDescriptionJa: string | null;
}

interface FeaturedProjectsProps {
  projects: FeaturedProject[];
}

export function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  const { locale } = useLocale();
  const { ref, visible } = useReveal();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={cn("reveal py-14 sm:py-16 border-border", visible && "visible")}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-[var(--accent-signature)] mb-1">
              {ui("portfolio", locale)}
            </p>
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {ui("featuredProjects", locale)}
            </h2>
          </div>
          <Link
            href="/projects"
            className="arrow-link inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2.5 -my-2.5"
          >
            {ui("viewAll", locale)}
            <ArrowRight className="h-4 w-4 arrow-icon" />
          </Link>
        </div>

        <div className="space-y-6">
          {projects[0] && (
            <ProjectCard
              key={projects[0].id}
              project={projects[0]}
              priority={true}
              index={0}
              featured={true}
            />
          )}
          {projects.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(1).map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  priority={false}
                  index={index + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
