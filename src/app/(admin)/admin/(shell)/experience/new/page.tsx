"use client";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ExperienceForm } from "@/components/admin/ExperienceForm";

export default function NewExperiencePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Experience", href: "/admin/experience" },
          { label: "New Experience" },
        ]}
      />
      <h1 className="text-2xl font-bold">New Experience</h1>
      <ExperienceForm />
    </div>
  );
}
