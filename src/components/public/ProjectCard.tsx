import { ExternalLink, Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProjectCardProps {
  project: {
    slug: string;
    title: string;
    shortDescription: string;
    techTags: string[];
    thumbnailImage: string;
    liveUrl?: string | null;
    repoUrl?: string | null;
  };
  priority?: boolean;
  index?: number;
}

export function ProjectCard({ project, priority = false, index = 0 }: ProjectCardProps) {
  return (
    <article
      className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow animate-in fade-in-0 slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
    >
      {/* Thumbnail */}
      {project.thumbnailImage && (
        <Link href={`/projects/${project.slug}`}>
          <div className="relative aspect-4/3 overflow-hidden bg-muted">
            <Image
              src={project.thumbnailImage}
              alt={project.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
            />
          </div>
        </Link>
      )}

      {/* Content */}
      <div className="p-5">
        <Link href={`/projects/${project.slug}`}>
          <h3 className="text-lg font-semibold text-foreground group-hover:text-muted-foreground transition-colors">
            {project.title}
          </h3>
        </Link>

        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {project.shortDescription}
        </p>

        {/* Tech Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.techTags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {project.techTags.length > 5 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
              +{project.techTags.length - 5}
            </span>
          )}
        </div>

        {/* Links */}
        <div className="mt-4 flex items-center gap-3">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Live Demo
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              Code
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
