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
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      {project.thumbnailImage && (
        <Link href={`/projects/${project.slug}`}>
          <div className="relative aspect-video overflow-hidden bg-gray-100">
            <Image
              src={project.thumbnailImage}
              alt={project.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        </Link>
      )}

      {/* Content */}
      <div className="p-5">
        <Link href={`/projects/${project.slug}`}>
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
            {project.title}
          </h3>
        </Link>

        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{project.shortDescription}</p>

        {/* Tech Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.techTags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-600"
            >
              {tag}
            </span>
          ))}
          {project.techTags.length > 5 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-400">
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
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
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
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
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
