"use client";

import { useLocale } from "@/hooks/use-locale";
import { t, ui } from "@/lib/i18n";
import type { AboutPage } from "@/lib/data/types";

interface AboutPageHeadingProps {
  intro: AboutPage | null;
}

export function AboutPageHeading({ intro }: AboutPageHeadingProps) {
  const { locale } = useLocale();

  const heading = intro ? t(intro, "heading", locale) : ui("aboutMe", locale);
  const subheading = intro ? t(intro, "subheading", locale) : ui("aboutMeSubheading", locale);

  return (
    <div className="mb-12">
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{heading}</h1>
      <p className="mt-3 text-muted-foreground max-w-lg">{subheading}</p>
    </div>
  );
}
