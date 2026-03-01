"use client";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { EducationForm } from "@/components/admin/EducationForm";

export default function NewEducationPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Education", href: "/admin/education" },
          { label: "New Education" },
        ]}
      />
      <h1 className="text-2xl font-bold">New Education</h1>
      <EducationForm />
    </div>
  );
}
