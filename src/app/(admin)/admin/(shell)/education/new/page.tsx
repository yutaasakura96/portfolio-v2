"use client";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import dynamic from "next/dynamic";

const EducationForm = dynamic(
  () => import("@/components/admin/EducationForm").then((m) => m.EducationForm),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse rounded-md bg-gray-100" />,
  }
);

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
