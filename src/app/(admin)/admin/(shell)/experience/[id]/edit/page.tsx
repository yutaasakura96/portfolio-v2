"use client";

import { ExperienceForm } from "@/components/admin/ExperienceForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { Experience } from "@/types/experience";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function EditExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "experience", id],
    queryFn: async () => {
      const response = await apiClient.getExperience<Experience, { total: number }>({
        visible: "all",
      });
      const experience = response.data.find((exp) => exp.id === id);
      if (!experience) {
        throw new Error("Experience not found");
      }
      return { data: experience };
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">Edit Experience</h1>
        <div className="flex flex-col items-center gap-4 p-12 text-center bg-white rounded-lg border">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Failed to load experience</h3>
            <p className="text-sm text-gray-600">
              {error instanceof Error
                ? error.message
                : "The experience may not exist or there was an error loading it."}
            </p>
          </div>
          <Link href="/admin/experience">
            <Button variant="outline">Back to Experience</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Edit Experience</h1>
      <ExperienceForm initialData={data?.data} experienceId={id} />
    </div>
  );
}
