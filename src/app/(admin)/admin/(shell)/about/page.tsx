"use client";

import { ImageUpload } from "@/components/admin/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { aboutPageUpdateSchema, type AboutPageUpdateInput } from "@/lib/validations/about";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const DEFAULT_HEADING = "About Me";
const DEFAULT_SUBHEADING =
  "My skills, professional experience, education, and certifications.";

type AboutPageData = {
  id: string;
  heading: string;
  subheading: string;
  profileName?: string | null;
  profileTitle?: string | null;
  profileCompany?: string | null;
  profileImageUrl?: string | null;
  introHeadline?: string | null;
  introBio?: string | null;
};

export default function AboutManagerPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["about-page"],
    queryFn: () => apiClient.getAboutPage<AboutPageData>(),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<AboutPageUpdateInput>({
    resolver: zodResolver(aboutPageUpdateSchema),
    defaultValues: {
      heading: DEFAULT_HEADING,
      subheading: DEFAULT_SUBHEADING,
      profileName: "",
      profileTitle: "",
      profileCompany: "",
      profileImageUrl: null,
      introHeadline: "",
      introBio: "",
    },
  });

  useEffect(() => {
    if (data?.data) {
      reset({
        heading: data.data.heading,
        subheading: data.data.subheading,
        profileName: data.data.profileName ?? "",
        profileTitle: data.data.profileTitle ?? "",
        profileCompany: data.data.profileCompany ?? "",
        profileImageUrl: data.data.profileImageUrl ?? null,
        introHeadline: data.data.introHeadline ?? "",
        introBio: data.data.introBio ?? "",
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: AboutPageUpdateInput) =>
      apiClient.updateAboutPage<AboutPageUpdateInput, AboutPageData>(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["about-page"] });
      toast.success("About page saved");
    },
    onError: () => {
      toast.error("Failed to save about page");
    },
  });

  const onSubmit = (values: AboutPageUpdateInput) => mutation.mutate(values);

  const heading = watch("heading");
  const subheading = watch("subheading");
  const introHeadline = watch("introHeadline");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">About Page</h1>
            <p className="mt-1 text-sm text-gray-500">
              Edit the content shown on your{" "}
              <Link
                href="/about"
                target="_blank"
                className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 underline underline-offset-2"
              >
                About page
                <ExternalLink className="h-3 w-3" />
              </Link>
            </p>
          </div>
          {isDirty && (
            <span className="text-xs text-amber-600 font-medium mt-1">Unsaved changes</span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Page Heading */}
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Page Heading
          </h2>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="heading">Heading</Label>
              <span className="text-xs text-gray-400">{heading?.length ?? 0} / 200</span>
            </div>
            <Input
              id="heading"
              {...register("heading")}
              placeholder={DEFAULT_HEADING}
              maxLength={200}
            />
            {errors.heading && (
              <p className="text-sm text-red-500">{errors.heading.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="subheading">Description</Label>
              <span className="text-xs text-gray-400">{subheading?.length ?? 0} / 500</span>
            </div>
            <Textarea
              id="subheading"
              {...register("subheading")}
              placeholder={DEFAULT_SUBHEADING}
              maxLength={500}
              rows={3}
            />
            {errors.subheading && (
              <p className="text-sm text-red-500">{errors.subheading.message}</p>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Profile Card
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Shown in the left column of the intro section.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <ImageUpload
              folder="profile"
              entityId="about"
              value={watch("profileImageUrl") ?? undefined}
              onUpload={(result) =>
                setValue("profileImageUrl", result.urls.display, { shouldDirty: true })
              }
              onRemove={() => setValue("profileImageUrl", null, { shouldDirty: true })}
              placeholder="Drag & drop a profile photo, or click to browse"
              aspectRatio="aspect-square"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profileName">Name</Label>
            <Input
              id="profileName"
              {...register("profileName")}
              placeholder="Yuta Asakura"
              maxLength={100}
            />
            {errors.profileName && (
              <p className="text-sm text-red-500">{errors.profileName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profileTitle">Title</Label>
            <Input
              id="profileTitle"
              {...register("profileTitle")}
              placeholder="Full-Stack Software Engineer"
              maxLength={150}
            />
            {errors.profileTitle && (
              <p className="text-sm text-red-500">{errors.profileTitle.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profileCompany">Company</Label>
            <Input
              id="profileCompany"
              {...register("profileCompany")}
              placeholder="HCLTech Japan"
              maxLength={150}
            />
            {errors.profileCompany && (
              <p className="text-sm text-red-500">{errors.profileCompany.message}</p>
            )}
          </div>
        </div>

        {/* Introduction Text */}
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Introduction Text
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Shown in the right column beside the profile card. Social links are pulled from Site
              Settings.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="introHeadline">Headline</Label>
              <span className="text-xs text-gray-400">{introHeadline?.length ?? 0} / 200</span>
            </div>
            <Input
              id="introHeadline"
              {...register("introHeadline")}
              placeholder="Hi 👋 I'm Yuta Asakura"
              maxLength={200}
            />
            {errors.introHeadline && (
              <p className="text-sm text-red-500">{errors.introHeadline.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="introBio">Bio</Label>
            <Textarea
              id="introBio"
              {...register("introBio")}
              placeholder="Write your introduction here. Separate paragraphs with a blank line."
              rows={8}
            />
            <p className="text-xs text-gray-400">Separate paragraphs with a blank line.</p>
            {errors.introBio && (
              <p className="text-sm text-red-500">{errors.introBio.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={!isDirty || mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
