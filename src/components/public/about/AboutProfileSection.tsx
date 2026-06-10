"use client";

import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";
import type { AboutPage } from "@/lib/data/types";
import { Github, Linkedin, Mail } from "lucide-react";
import Image from "next/image";

type SocialLinks = {
  github?: string;
  linkedin?: string;
};

interface AboutProfileSectionProps {
  intro: AboutPage;
  profileImage?: string | null;
  email?: string | null;
  socialLinks?: SocialLinks;
}

export function AboutProfileSection({
  intro,
  profileImage,
  email,
  socialLinks,
}: AboutProfileSectionProps) {
  const { locale } = useLocale();
  const bioText = t(intro, "introBio", locale);
  const paragraphs = bioText?.split(/\n\n+/).filter(Boolean) ?? [];
  const hasProfileCard = intro.profileName || profileImage;
  const introHeadline = t(intro, "introHeadline", locale);
  const hasIntroContent = introHeadline || paragraphs.length > 0;

  if (!hasProfileCard && !hasIntroContent) return null;

  const hasSocial = email || socialLinks?.github || socialLinks?.linkedin;

  return (
    <div className="mb-16 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-12 md:gap-16">
      {/* Left: Profile Card */}
      <div className="flex flex-col items-center text-center">
        {profileImage && (
          <div className="relative size-44 mx-auto mb-6">
            {/* Profile image */}
            <div className="relative size-44 rounded-full overflow-hidden z-10">
              <Image
                src={profileImage}
                alt={intro.profileName ?? "Profile photo"}
                fill
                className="object-cover"
                priority
                sizes="176px"
              />
            </div>
          </div>
        )}

        {intro.profileName && (
          <h2 className="text-xl font-bold text-foreground">{intro.profileName}</h2>
        )}
        {t(intro, "profileTitle", locale) && (
          <p className="mt-1 text-sm text-muted-foreground">{t(intro, "profileTitle", locale)}</p>
        )}
        {intro.profileCompany && (
          <p className="mt-0.5 text-sm text-muted-foreground">{intro.profileCompany}</p>
        )}

        {hasSocial && (
          <div className="mt-5 flex items-center gap-5">
            {email && (
              <a
                href={`mailto:${email}`}
                aria-label="Email"
                className="pressable text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <Mail className="h-5 w-5" />
              </a>
            )}
            {socialLinks?.github && (
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="pressable text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <Github className="h-5 w-5" />
              </a>
            )}
            {socialLinks?.linkedin && (
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="pressable text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Right: Introduction Content */}
      <div>
        {introHeadline && (
          <h2 className="text-2xl font-bold text-foreground mb-6">{introHeadline}</h2>
        )}
        {paragraphs.length > 0 && (
          <div className="space-y-4 max-w-2xl">
            {paragraphs.map((paragraph, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
