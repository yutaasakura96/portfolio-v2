import { ImageGallery } from "@/components/public/ImageGallery";
import { JsonLd } from "@/components/public/JsonLd";
import {
  getAdjacentProjects,
  getProjectBySlug,
  getPublishedProjectSlugs,
} from "@/lib/data/public-queries";
import { markdownToHtml } from "@/lib/markdown";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, ExternalLink, Github } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export async function generateStaticParams() {
  const projects = await getPublishedProjectSlugs();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project Not Found" };

  return {
    title: project.title,
    description: project.shortDescription,
    openGraph: {
      title: project.title,
      description: project.shortDescription,
      images: [{ url: project.thumbnailImage, width: 1200, height: 630 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  let descriptionHtml = "";
  let problemHtml: string | null = null;
  let solutionHtml: string | null = null;

  try {
    if (project.description) {
      descriptionHtml = await markdownToHtml(project.description);
    }
    if (project.problem) {
      problemHtml = await markdownToHtml(project.problem);
    }
    if (project.solution) {
      solutionHtml = await markdownToHtml(project.solution);
    }
  } catch (error) {
    console.error("Error processing markdown:", error);
  }

  const { prev, next } = await getAdjacentProjects(project.displayOrder);

  const images = (project.images as { url: string; alt: string; order: number }[]) ?? [];
  const sortedImages = [...images].sort((a, b) => a.order - b.order);

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: project.title,
          description: project.shortDescription,
          image: project.thumbnailImage,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${project.slug}`,
          dateCreated: project.startDate?.toISOString(),
          author: {
            "@type": "Person",
            name: "Yuta Asakura",
          },
        }}
      />

      {/* Back Link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All Projects
      </Link>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{project.title}</h1>
        <p className="mt-3 text-lg text-gray-600">{project.shortDescription}</p>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          {project.role && <span>Role: {project.role}</span>}
          {project.startDate && (
            <span>
              {format(new Date(project.startDate), "MMM yyyy")}
              {project.endDate
                ? ` – ${format(new Date(project.endDate), "MMM yyyy")}`
                : " – Present"}
            </span>
          )}
        </div>

        {/* Links */}
        <div className="mt-4 flex gap-3">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Live Demo
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Github className="h-4 w-4" />
              Source Code
            </a>
          )}
        </div>
      </header>

      {/* Thumbnail / Hero Image */}
      {project.thumbnailImage && (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-100 mb-8">
          <Image
            src={project.thumbnailImage}
            alt={project.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {/* Tech Stack */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Tech Stack
        </h2>
        <div className="flex flex-wrap gap-2">
          {project.techTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Problem / Solution (if present) */}
      {(problemHtml || solutionHtml) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {problemHtml && (
            <div className="p-5 rounded-xl bg-red-50 border border-red-100">
              <h2 className="text-sm font-semibold text-red-800 uppercase tracking-wider mb-2">
                The Problem
              </h2>
              <div
                className="prose prose-sm prose-red max-w-none"
                dangerouslySetInnerHTML={{ __html: problemHtml }}
              />
            </div>
          )}
          {solutionHtml && (
            <div className="p-5 rounded-xl bg-green-50 border border-green-100">
              <h2 className="text-sm font-semibold text-green-800 uppercase tracking-wider mb-2">
                The Solution
              </h2>
              <div
                className="prose prose-sm prose-green max-w-none"
                dangerouslySetInnerHTML={{ __html: solutionHtml }}
              />
            </div>
          )}
        </div>
      )}

      {/* Full Description */}
      {descriptionHtml && (
        <div
          className="prose prose-gray max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      )}

      {/* Image Gallery */}
      {sortedImages.length > 0 && (
        <ImageGallery images={sortedImages} projectTitle={project.title} />
      )}

      {/* Next / Previous Navigation */}
      <nav className="mt-12 pt-8 border-t border-gray-200 flex justify-between">
        {prev ? (
          <Link
            href={`/projects/${prev.slug}`}
            className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <div>
              <div className="text-xs text-gray-400">Previous</div>
              <div className="font-medium">{prev.title}</div>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/projects/${next.slug}`}
            className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors text-right"
          >
            <div>
              <div className="text-xs text-gray-400">Next</div>
              <div className="font-medium">{next.title}</div>
            </div>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </article>
  );
}
