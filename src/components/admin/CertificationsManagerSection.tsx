"use client";

import { CertificationFormDialog } from "@/components/admin/CertificationFormDialog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ImportExportToolbar } from "@/components/admin/ImportExportToolbar";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import type { Certification } from "@/lib/data/types";
import { entityConfigs } from "@/lib/import-export";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isExpired(expirationDate: Date | string | null): boolean {
  if (!expirationDate) return false;
  return new Date(expirationDate) < new Date();
}

export function CertificationsManagerSection() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "certifications"],
    queryFn: () =>
      apiClient.getCertifications<Certification, { total: number }>({
        visible: "all",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteCertification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "certifications"] });
      toast.success("Certification deleted");
      setDeleteId(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to delete certification";
      toast.error(message);
    },
  });

  const certifications = data?.data ?? [];
  const hasCertifications = certifications.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Certifications</h2>
        <div className="flex items-center gap-2">
          <ImportExportToolbar
            entity="certifications"
            entityLabel="Certifications"
            entityConfig={entityConfigs.certifications}
            queryKey={["admin", "certifications"]}
          />
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Certification
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg border border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Failed to load certifications</p>
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : hasCertifications ? (
        <div className="bg-card rounded-lg border divide-y">
          {certifications.map((cert) => {
            const expired = isExpired(cert.expirationDate);
            return (
              <div key={cert.id} className="flex items-center gap-4 px-4 py-3">
                {cert.badgeImage && (
                  <Image
                    src={cert.badgeImage}
                    alt={cert.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{cert.name}</span>
                    {!cert.visible && <Badge variant="secondary">Hidden</Badge>}
                    {cert.expirationDate && (
                      <Badge variant={expired ? "destructive" : "default"}>
                        {expired ? "Expired" : "Active"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>Earned: {formatDate(cert.dateEarned)}</span>
                    {cert.expirationDate && (
                      <span>
                        {expired ? "Expired" : "Expires"}: {formatDate(cert.expirationDate)}
                      </span>
                    )}
                    {cert.credentialId && <span>ID: {cert.credentialId}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingCert(cert)}
                    aria-label={`Edit ${cert.name} certification`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(cert.id)}
                    aria-label={`Delete ${cert.name} certification`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-lg border p-12 text-center">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No certifications yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by adding your professional certifications.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Certification
          </Button>
        </div>
      )}

      <CertificationFormDialog
        open={isCreateOpen || !!editingCert}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingCert(null);
          }
        }}
        initialData={editingCert}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Certification"
        description="Are you sure you want to delete this certification? This action cannot be undone."
        isLoading={deleteMutation.isPending}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
