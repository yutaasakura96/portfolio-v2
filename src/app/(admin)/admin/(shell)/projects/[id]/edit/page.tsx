'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ProjectForm } from '@/components/admin/ProjectForm';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { use } from 'react';
import { Project } from '@/types/project';

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'project', id],
    queryFn: () => apiClient.getProject<Project>(id),
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
        <h1 className="text-2xl font-bold">Edit Project</h1>
        <div className="flex flex-col items-center gap-4 p-12 text-center bg-white rounded-lg border">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Failed to load project</h3>
            <p className="text-sm text-gray-600">
              {error instanceof Error ? error.message : 'The project may not exist or there was an error loading it.'}
            </p>
          </div>
          <Link href="/admin/projects">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Edit Project</h1>
      <ProjectForm initialData={data?.data} projectId={id} />
    </div>
  );
}
