"use client";

import type { Hero } from "@/lib/data/types";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ResumeModal } from "./ResumeModal";

interface CtaButton {
  label: string;
  url: string;
  variant: "primary" | "secondary";
  type?: "link" | "resume";
}

interface HeroSectionProps {
  hero: Hero;
}

export function HeroSection({ hero }: HeroSectionProps) {
  const ctaButtons = (hero.ctaButtons as unknown as CtaButton[]) ?? [];
  const [resumeOpen, setResumeOpen] = useState(false);

  const primaryClass =
    "inline-flex items-center px-6 py-3 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors";
  const secondaryClass =
    "inline-flex items-center px-6 py-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors";

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col-reverse items-center gap-10 md:flex-row md:gap-16">
          {/* Text Content */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              {hero.headline}
            </h1>
            {hero.subheadline && <p className="mt-4 text-xl text-gray-600">{hero.subheadline}</p>}
            <p className="mt-6 text-base leading-relaxed text-gray-600 max-w-lg">{hero.bio}</p>

            {/* CTA Buttons */}
            {ctaButtons.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start">
                {ctaButtons.map((btn, i) =>
                  btn.type === "resume" ? (
                    <button
                      key={i}
                      onClick={() => setResumeOpen(true)}
                      className={btn.variant === "primary" ? primaryClass : secondaryClass}
                    >
                      {btn.label}
                    </button>
                  ) : (
                    <Link
                      key={btn.url}
                      href={btn.url}
                      className={btn.variant === "primary" ? primaryClass : secondaryClass}
                    >
                      {btn.label}
                    </Link>
                  )
                )}
              </div>
            )}
          </div>

          {/* Profile Image */}
          {hero.profileImage && (
            <div className="shrink-0">
              <div className="relative h-48 w-48 sm:h-56 sm:w-56 overflow-hidden rounded-xl">
                <Image
                  src={hero.profileImage}
                  alt="Profile photo"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 640px) 192px, 224px"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {hero.resumeUrl && (
        <ResumeModal
          open={resumeOpen}
          onClose={() => setResumeOpen(false)}
          resumeUrl={hero.resumeUrl}
        />
      )}
    </section>
  );
}
