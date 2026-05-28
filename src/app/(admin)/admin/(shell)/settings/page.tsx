"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { siteSettingsUpdateSchema, type SiteSettingsUpdateInput } from "@/lib/validations/settings";
import { ImportExportToolbar } from "@/components/admin/ImportExportToolbar";
import { entityConfigs } from "@/lib/import-export";
import { cn } from "@/lib/utils";
import { Globe, Github, Linkedin, Loader2, Save, Twitter, Youtube } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const { data: settingsData, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SiteSettingsUpdateInput>({
    resolver: zodResolver(siteSettingsUpdateSchema),
    defaultValues: {
      siteName: "",
      siteDescription: "",
      email: "",
      googleAnalyticsId: "",
      socialLinks: {
        github: "",
        linkedin: "",
        twitter: "",
        youtube: "",
        website: "",
      },
    },
  });

  useEffect(() => {
    if (settingsData?.data) {
      const s = settingsData.data;
      reset({
        siteName: s.siteName || "",
        siteDescription: s.siteDescription || "",
        email: s.email || "",
        googleAnalyticsId: s.googleAnalyticsId || "",
        socialLinks: {
          github: s.socialLinks?.github || "",
          linkedin: s.socialLinks?.linkedin || "",
          twitter: s.socialLinks?.twitter || "",
          youtube: s.socialLinks?.youtube || "",
          website: s.socialLinks?.website || "",
        },
      });
    }
  }, [settingsData, reset]);

  const onSubmit = (data: SiteSettingsUpdateInput) => {
    updateSettings.mutate(data, {
      onSuccess: () => {
        toast.success("Settings saved successfully");
      },
      onError: () => {
        toast.error("Failed to save settings");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your portfolio&apos;s global settings.
          </p>
        </div>
        <ImportExportToolbar
          entity="settings"
          entityLabel="Settings"
          entityConfig={entityConfigs.settings}
          queryKey={["admin", "settings"]}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* General Section */}
        <section className="space-y-4">
          <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
            General
          </h2>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Site Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              {...register("siteName")}
              className={cn(
                "mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/10 bg-background text-foreground",
                errors.siteName
                  ? "border-destructive/50 focus:border-destructive"
                  : "border-input focus:border-ring"
              )}
              placeholder="Your Name | Portfolio"
            />
            {errors.siteName && (
              <p className="mt-1 text-sm text-destructive">{errors.siteName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Site Description</label>
            <textarea
              rows={3}
              {...register("siteDescription")}
              className="mt-1 block w-full resize-y rounded-lg border border-input px-4 py-2.5 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/10 bg-background text-foreground"
              placeholder="A short description of your portfolio"
            />
            {errors.siteDescription && (
              <p className="mt-1 text-sm text-destructive">{errors.siteDescription.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Contact Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              {...register("email")}
              className={cn(
                "mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/10 bg-background text-foreground",
                errors.email
                  ? "border-destructive/50 focus:border-destructive"
                  : "border-input focus:border-ring"
              )}
              placeholder="hello@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
        </section>

        {/* Social Links Section */}
        <section className="space-y-4">
          <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
            Social Links
          </h2>

          {(
            [
              {
                key: "github" as const,
                icon: Github,
                label: "GitHub",
                placeholder: "https://github.com/username",
              },
              {
                key: "linkedin" as const,
                icon: Linkedin,
                label: "LinkedIn",
                placeholder: "https://linkedin.com/in/username",
              },
              {
                key: "twitter" as const,
                icon: Twitter,
                label: "Twitter / X",
                placeholder: "https://twitter.com/username",
              },
              {
                key: "youtube" as const,
                icon: Youtube,
                label: "YouTube",
                placeholder: "https://youtube.com/@username",
              },
              {
                key: "website" as const,
                icon: Globe,
                label: "Website",
                placeholder: "https://example.com",
              },
            ] as const
          ).map(({ key, icon: Icon, label, placeholder }) => (
            <div key={key}>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Icon className="h-4 w-4" />
                {label}
              </label>
              <input
                type="url"
                {...register(`socialLinks.${key}`)}
                className={cn(
                  "mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/10 bg-background text-foreground",
                  errors.socialLinks?.[key]
                    ? "border-destructive/50 focus:border-destructive"
                    : "border-input focus:border-ring"
                )}
                placeholder={placeholder}
              />
              {errors.socialLinks?.[key] && (
                <p className="mt-1 text-sm text-destructive">{errors.socialLinks[key]?.message}</p>
              )}
            </div>
          ))}
        </section>

        {/* Analytics Section */}
        <section className="space-y-4">
          <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
            Analytics
          </h2>

          <div>
            <label className="block text-sm font-medium text-foreground">Google Analytics ID</label>
            <input
              type="text"
              {...register("googleAnalyticsId")}
              className="mt-1 block w-full rounded-lg border border-input px-4 py-2.5 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/10 bg-background text-foreground"
              placeholder="G-XXXXXXXXXX"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Your Google Analytics 4 measurement ID. Leave blank to disable.
            </p>
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <button
            type="submit"
            disabled={!isDirty || updateSettings.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateSettings.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
