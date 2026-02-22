"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/api-client";
import {
  CertificationCreateInput,
  certificationCreateSchema,
} from "@/lib/validations/certification";
import { Certification } from "@/types/certification";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

interface CertificationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Certification | null;
}

export function CertificationFormDialog({
  open,
  onOpenChange,
  initialData,
}: CertificationFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const form = useForm<CertificationCreateInput>({
    resolver: zodResolver(certificationCreateSchema) as Resolver<CertificationCreateInput>,
    defaultValues: initialData
      ? {
          name: initialData.name,
          issuer: initialData.issuer,
          dateEarned: initialData.dateEarned ? new Date(initialData.dateEarned) : undefined,
          expirationDate: initialData.expirationDate
            ? new Date(initialData.expirationDate)
            : undefined,
          credentialId: initialData.credentialId ?? "",
          credentialUrl: initialData.credentialUrl ?? "",
          badgeImage: initialData.badgeImage ?? "",
          displayOrder: initialData.displayOrder,
          visible: initialData.visible,
        }
      : {
          name: "",
          issuer: "",
          credentialId: "",
          credentialUrl: "",
          badgeImage: "",
          displayOrder: 0,
          visible: true,
        },
  });

  const mutation = useMutation({
    mutationFn: (values: CertificationCreateInput) =>
      isEditing
        ? apiClient.updateCertification(initialData.id, values)
        : apiClient.createCertification(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "certifications"] });
      toast.success(isEditing ? "Certification updated" : "Certification created");
      onOpenChange(false);
      form.reset();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to save certification";
      toast.error(message);
    },
  });

  const handleSubmit = (values: CertificationCreateInput) => {
    mutation.mutate(values);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !mutation.isPending) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const visible = form.watch("visible");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Certification" : "Add Certification"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the certification information below."
              : "Add a new professional certification or course completion."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Certification Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="e.g., AWS Certified Solutions Architect"
              aria-invalid={!!form.formState.errors.name}
              aria-describedby={form.formState.errors.name ? "name-error" : undefined}
            />
            {form.formState.errors.name && (
              <p id="name-error" className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuer">Issuing Organization *</Label>
            <Input
              id="issuer"
              {...form.register("issuer")}
              placeholder="e.g., Amazon Web Services"
              aria-invalid={!!form.formState.errors.issuer}
              aria-describedby={form.formState.errors.issuer ? "issuer-error" : undefined}
            />
            {form.formState.errors.issuer && (
              <p id="issuer-error" className="text-sm text-red-500">
                {form.formState.errors.issuer.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateEarned">Date Earned *</Label>
              <Input
                id="dateEarned"
                type="date"
                {...form.register("dateEarned")}
                aria-invalid={!!form.formState.errors.dateEarned}
                aria-describedby={form.formState.errors.dateEarned ? "dateEarned-error" : undefined}
              />
              {form.formState.errors.dateEarned && (
                <p id="dateEarned-error" className="text-sm text-red-500">
                  {form.formState.errors.dateEarned.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                {...form.register("expirationDate")}
                aria-invalid={!!form.formState.errors.expirationDate}
                aria-describedby={
                  form.formState.errors.expirationDate ? "expirationDate-error" : undefined
                }
              />
              {form.formState.errors.expirationDate && (
                <p id="expirationDate-error" className="text-sm text-red-500">
                  {form.formState.errors.expirationDate.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Leave empty if no expiration</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credentialId">Credential ID</Label>
              <Input
                id="credentialId"
                {...form.register("credentialId")}
                placeholder="e.g., ABC123XYZ"
                aria-invalid={!!form.formState.errors.credentialId}
                aria-describedby={
                  form.formState.errors.credentialId ? "credentialId-error" : undefined
                }
              />
              {form.formState.errors.credentialId && (
                <p id="credentialId-error" className="text-sm text-red-500">
                  {form.formState.errors.credentialId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                {...form.register("displayOrder", { valueAsNumber: true })}
                placeholder="0"
                aria-invalid={!!form.formState.errors.displayOrder}
                aria-describedby={
                  form.formState.errors.displayOrder ? "displayOrder-error" : undefined
                }
              />
              {form.formState.errors.displayOrder && (
                <p id="displayOrder-error" className="text-sm text-red-500">
                  {form.formState.errors.displayOrder.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="credentialUrl">Credential URL</Label>
            <Input
              id="credentialUrl"
              type="url"
              {...form.register("credentialUrl")}
              placeholder="https://..."
              aria-invalid={!!form.formState.errors.credentialUrl}
              aria-describedby={
                form.formState.errors.credentialUrl ? "credentialUrl-error" : undefined
              }
            />
            {form.formState.errors.credentialUrl && (
              <p id="credentialUrl-error" className="text-sm text-red-500">
                {form.formState.errors.credentialUrl.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Link to verify the certification</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="badgeImage">Badge Image URL</Label>
            <Input
              id="badgeImage"
              type="url"
              {...form.register("badgeImage")}
              placeholder="https://..."
              aria-invalid={!!form.formState.errors.badgeImage}
              aria-describedby={form.formState.errors.badgeImage ? "badgeImage-error" : undefined}
            />
            {form.formState.errors.badgeImage && (
              <p id="badgeImage-error" className="text-sm text-red-500">
                {form.formState.errors.badgeImage.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Certification badge or logo image URL</p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Switch
              id="visible"
              checked={visible}
              onCheckedChange={(val) => form.setValue("visible", val)}
            />
            <Label htmlFor="visible" className="cursor-pointer">
              Visible on public site
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
