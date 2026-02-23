import { ProjectCard } from "@/components/public/ProjectCard";
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
}

interface FeaturedProjectsProps {
  projects: FeaturedProject[];
}

export function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Featured Projects</h2>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
