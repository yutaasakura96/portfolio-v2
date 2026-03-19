"use client";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import dynamic from "next/dynamic";

const ExperienceForm = dynamic(
  () => import("@/components/admin/ExperienceForm").then((m) => m.ExperienceForm),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse rounded-md bg-gray-100" />,
  }
);

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
