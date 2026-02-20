import { prisma } from "../src/lib/prismaClient";

async function main() {
  console.log("Seeding database...");

  // ── Site Settings (singleton) ──
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "John Doe | Portfolio",
      siteDescription: "Full-stack developer portfolio showcasing projects and skills",
      email: "hello@example.com",
      socialLinks: {
        github: "https://github.com/johndoe",
        linkedin: "https://linkedin.com/in/johndoe",
      },
    },
  });

  // ── Hero (singleton) ──
  const existingHero = await prisma.hero.findFirst();
  if (!existingHero) {
    await prisma.hero.create({
      data: {
        headline: "Full-Stack Developer",
        subheadline: "Building modern web applications with React, Node.js, and AWS",
        bio: "I'm a passionate developer with experience building production-grade web applications. I love solving complex problems and creating intuitive user experiences.",
        profileImage: "https://via.placeholder.com/400x400",
        resumeUrl: null,
        ctaButtons: [
          { label: "View Projects", url: "/projects", variant: "primary" },
          { label: "Contact Me", url: "/contact", variant: "secondary" },
        ],
      },
    });
  }

  // ── Sample Projects ──
  await prisma.project.upsert({
    where: { slug: "ecommerce-platform" },
    update: {},
    create: {
      slug: "ecommerce-platform",
      title: "E-Commerce Platform",
      shortDescription:
        "A full-featured online store with payment processing and inventory management.",
      description: "Built a modern e-commerce platform from scratch...",
      techTags: ["Next.js", "TypeScript", "Stripe", "PostgreSQL", "Tailwind CSS"],
      images: [
        { url: "https://via.placeholder.com/800x600", alt: "E-Commerce Dashboard", order: 0 },
      ],
      thumbnailImage: "https://via.placeholder.com/400x300",
      liveUrl: "https://example.com",
      repoUrl: "https://github.com/johndoe/ecommerce",
      featured: true,
      displayOrder: 0,
      status: "PUBLISHED",
    },
  });

  await prisma.project.upsert({
    where: { slug: "task-management-app" },
    update: {},
    create: {
      slug: "task-management-app",
      title: "Task Management App",
      shortDescription: "A collaborative task management tool with real-time updates.",
      description: "Designed and developed a Kanban-style task manager...",
      techTags: ["React", "Node.js", "Socket.io", "MongoDB"],
      images: [{ url: "https://via.placeholder.com/800x600", alt: "Task Board", order: 0 }],
      thumbnailImage: "https://via.placeholder.com/400x300",
      featured: false,
      displayOrder: 1,
      status: "PUBLISHED",
    },
  });

  // ── Sample Blog Post ──
  await prisma.blogPost.upsert({
    where: { slug: "getting-started-with-nextjs" },
    update: {},
    create: {
      slug: "getting-started-with-nextjs",
      title: "Getting Started with Next.js App Router",
      content: "# Getting Started with Next.js App Router\n\nThe App Router is the new paradigm...",
      excerpt: "A comprehensive guide to building modern web apps with the Next.js App Router.",
      tags: ["Next.js", "React", "TypeScript"],
      readTime: 8,
      status: "PUBLISHED",
      publishedAt: new Date("2026-01-15"),
    },
  });

  // ── Sample Skills ──
  const skills = [
    {
      name: "TypeScript",
      category: "Languages",
      proficiencyLevel: "EXPERT" as const,
      displayOrder: 0,
    },
    {
      name: "JavaScript",
      category: "Languages",
      proficiencyLevel: "EXPERT" as const,
      displayOrder: 1,
    },
    {
      name: "Python",
      category: "Languages",
      proficiencyLevel: "ADVANCED" as const,
      displayOrder: 2,
    },
    { name: "React", category: "Frontend", proficiencyLevel: "EXPERT" as const, displayOrder: 0 },
    { name: "Next.js", category: "Frontend", proficiencyLevel: "EXPERT" as const, displayOrder: 1 },
    {
      name: "Tailwind CSS",
      category: "Frontend",
      proficiencyLevel: "ADVANCED" as const,
      displayOrder: 2,
    },
    {
      name: "Node.js",
      category: "Backend",
      proficiencyLevel: "ADVANCED" as const,
      displayOrder: 0,
    },
    {
      name: "PostgreSQL",
      category: "Backend",
      proficiencyLevel: "ADVANCED" as const,
      displayOrder: 1,
    },
    { name: "AWS", category: "DevOps", proficiencyLevel: "INTERMEDIATE" as const, displayOrder: 0 },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { id: skill.name.toLowerCase().replace(/[^a-z0-9]/g, "-") },
      update: {},
      create: skill,
    });
  }

  // ── Sample Experience ──
  await prisma.experience.create({
    data: {
      company: "Tech Company Inc.",
      role: "Senior Frontend Developer",
      location: "Remote",
      startDate: new Date("2023-01-01"),
      description:
        "Led frontend development for the main product, improving performance and user experience.",
      highlights: [
        "Led migration of legacy system to modern React/Next.js stack",
        "Reduced page load times by 60% through image optimization and CDN implementation",
        "Implemented CI/CD pipeline with automated testing",
      ],
      displayOrder: 1,
    },
  });

  // ── Sample Education ──
  await prisma.education.create({
    data: {
      institution: "State University",
      degree: "Bachelor of Science",
      field: "Computer Science",
      startDate: new Date("2018-09-01"),
      endDate: new Date("2022-05-01"),
      achievements: "Dean's List, Senior Capstone Award",
      displayOrder: 1,
    },
  });

  // ── Sample Certification ──
  await prisma.certification.create({
    data: {
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      dateEarned: new Date("2025-06-01"),
      credentialUrl: "https://aws.amazon.com/certification/",
      displayOrder: 1,
    },
  });

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
