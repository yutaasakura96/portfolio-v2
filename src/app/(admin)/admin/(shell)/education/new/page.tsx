"use client";

import { EducationForm } from "@/components/admin/EducationForm";

export default function NewEducationPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">New Education</h1>
      <EducationForm />
    </div>
  );
}
