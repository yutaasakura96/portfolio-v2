"use client";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import dynamic from "next/dynamic";

const ProjectForm = dynamic(
  () => import("@/components/admin/ProjectForm").then((m) => m.ProjectForm),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse rounded-md bg-gray-100" />,
  }
);

export default function NewProjectPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Projects", href: "/admin/projects" },
          { label: "New Project" },
        ]}
      />
      <h1 className="text-2xl font-bold">New Project</h1>
      <ProjectForm />
    </div>
  );
}
