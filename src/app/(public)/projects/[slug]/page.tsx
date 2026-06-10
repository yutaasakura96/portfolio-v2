import { BreadcrumbJsonLd } from "@/components/public/BreadcrumbJsonLd";
import { ImageGallery } from "@/components/public/ImageGallery";
import { JsonLd } from "@/components/public/JsonLd";
import { LocalizedHtml, LocalizedText, LocalizedUi } from "@/components/public/LocalizedContent";
import { ProjectDetailNav } from "@/components/public/ProjectDetailNav";
import {
  getAdjacentProjects,
  getProjectBySlug,
  getPublishedProjectSlugs,
} from "@/lib/data/public-queries";
import { markdownToHtml } from "@/lib/markdown";
import { normalizeImagesToGroups } from "@/lib/validations/project";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

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
      type: "article",
      images: [{ url: `/projects/${slug}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.shortDescription,
      images: [`/projects/${slug}/opengraph-image`],
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
  let descriptionHtmlJa: string | null = null;
  let problemHtml: string | null = null;
  let problemHtmlJa: string | null = null;
  let solutionHtml: string | null = null;
  let solutionHtmlJa: string | null = null;

  try {
    if (project.description) {
      descriptionHtml = await markdownToHtml(project.description);
    }
    if (project.descriptionJa) {
      descriptionHtmlJa = await markdownToHtml(project.descriptionJa);
    }
    if (project.problem) {
      problemHtml = await markdownToHtml(project.problem);
    }
    if (project.problemJa) {
      problemHtmlJa = await markdownToHtml(project.problemJa);
    }
    if (project.solution) {
      solutionHtml = await markdownToHtml(project.solution);
    }
    if (project.solutionJa) {
      solutionHtmlJa = await markdownToHtml(project.solutionJa);
    }
  } catch (error) {
    console.error("Error processing markdown:", error);
  }

  const { prev, next } = await getAdjacentProjects(project.displayOrder);

  const imageGroups = normalizeImagesToGroups(project.images);

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://asakurayuta.dev" },
          { name: "Projects", url: "https://asakurayuta.dev/projects" },
          { name: project.title, url: `https://asakurayuta.dev/projects/${project.slug}` },
        ]}
      />
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
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <LocalizedUi k="allProjects" />
      </Link>

      {/* Header */}
      <header className="mb-8">
        <LocalizedText
          en={project.title}
          ja={project.titleJa}
          as="h1"
          className="text-3xl font-bold text-foreground sm:text-4xl"
        />
        <LocalizedText
          en={project.shortDescription}
          ja={project.shortDescriptionJa}
          as="p"
          className="mt-3 text-lg text-muted-foreground"
        />

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {project.role && (
            <LocalizedText
              en={`Role: ${project.role}`}
              ja={project.roleJa ? `役割: ${project.roleJa}` : null}
            />
          )}
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <LocalizedUi k="liveDemo" />
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
            >
              <Github className="h-4 w-4" />
              <LocalizedUi k="sourceCode" />
            </a>
          )}
        </div>
      </header>

      {/* Thumbnail / Hero Image */}
      {project.thumbnailImage && (
        <div className="rounded-xl overflow-hidden mb-8">
          <Image
            src={project.thumbnailImage}
            alt={project.title}
            width={1600}
            height={1200}
            className="w-full h-auto"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {/* Tech Stack */}
      <div className="mb-8">
        <LocalizedUi
          k="techStack"
          as="h2"
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
        />
        <div className="flex flex-wrap gap-2">
          {project.techTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-sm font-medium text-foreground"
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
            <div className="p-5 rounded-xl bg-red-50 border border-red-100 dark:bg-red-950/40 dark:border-red-900/60">
              <LocalizedUi
                k="theProblem"
                as="h2"
                className="text-sm font-semibold text-red-800 uppercase tracking-wider mb-2 dark:text-red-300"
              />
              <LocalizedHtml
                enHtml={problemHtml}
                jaHtml={problemHtmlJa}
                className="prose prose-sm prose-red max-w-none dark:prose-invert"
              />
            </div>
          )}
          {solutionHtml && (
            <div className="p-5 rounded-xl bg-green-50 border border-green-100 dark:bg-green-950/40 dark:border-green-900/60">
              <LocalizedUi
                k="theSolution"
                as="h2"
                className="text-sm font-semibold text-green-800 uppercase tracking-wider mb-2 dark:text-green-300"
              />
              <LocalizedHtml
                enHtml={solutionHtml}
                jaHtml={solutionHtmlJa}
                className="prose prose-sm prose-green max-w-none dark:prose-invert"
              />
            </div>
          )}
        </div>
      )}

      {/* Full Description */}
      {descriptionHtml && (
        <LocalizedHtml
          enHtml={descriptionHtml}
          jaHtml={descriptionHtmlJa}
          className="prose prose-gray max-w-none mb-8 dark:prose-invert"
        />
      )}

      {/* Image Gallery */}
      {imageGroups.length > 0 && imageGroups.some((g) => g.images.length > 0) && (
        <ImageGallery groups={imageGroups} projectTitle={project.title} />
      )}

      {/* Next / Previous Navigation */}
      <ProjectDetailNav prev={prev} next={next} />
    </article>
  );
}
