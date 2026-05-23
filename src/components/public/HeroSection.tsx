"use client";

import type { Hero } from "@/lib/data/types";
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
    "inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors";
  const secondaryClass =
    "inline-flex items-center px-6 py-3 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors";

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {hero.headline}
          </h1>
          {hero.subheadline && (
            <p className="mt-4 text-xl text-muted-foreground">{hero.subheadline}</p>
          )}
          <p className="mt-6 text-base leading-relaxed text-muted-foreground max-w-lg">
            {hero.bio}
          </p>

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
