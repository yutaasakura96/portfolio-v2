import { prisma } from "@/lib/prismaClient";

export default async function Home() {
  // Test database connection
  const settings = await prisma.siteSettings.findFirst();
  const projectCount = await prisma.project.count();
  const postCount = await prisma.blogPost.count();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">{settings?.siteName || "Portfolio V2"}</h1>
      <p className="text-lg text-gray-600 mb-8">{settings?.siteDescription || "Coming soon..."}</p>
      <div className="flex gap-4 text-sm text-gray-500">
        <span>📁 {projectCount} projects</span>
        <span>📝 {postCount} blog posts</span>
      </div>
      <p className="mt-8 text-sm text-green-600">
        ✅ Database connected — Sprint 1 infrastructure working!
      </p>
    </main>
  );
}
