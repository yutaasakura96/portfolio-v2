"use client";

import { ProjectForm } from "@/components/admin/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">New Project</h1>
      <ProjectForm />
    </div>
  );
}
