"use client";

import type { Hero } from "@/lib/data/types";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ResumeModal } from "./ResumeModal";

const HeroBlob = dynamic(() => import("./HeroBlob").then((m) => ({ default: m.HeroBlob })), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full rounded-full opacity-[0.08] dark:opacity-[0.04] blur-3xl"
      style={{ background: `radial-gradient(circle, var(--accent-signature), transparent 70%)` }}
    />
  ),
});

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      {/* Subtle dot pattern background */}
      <div className="absolute inset-0 dot-pattern opacity-40 dark:opacity-30" aria-hidden="true" />

      {/* Gradient orb — signature accent, toned down in dark mode */}
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.08] dark:opacity-[0.04] blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, var(--accent-signature), transparent 70%)` }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">
          <div className="max-w-2xl lg:flex-1">
            {/* Greeting line */}
            <p
              className="text-sm font-medium tracking-wide uppercase text-[var(--accent-signature)] mb-4"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 500ms var(--ease-out), transform 500ms var(--ease-out)",
              }}
            >
              Hello, I&apos;m
            </p>

            {/* Main headline with stagger */}
            <h1
              className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(12px)",
                transition:
                  "opacity 600ms var(--ease-out) 100ms, transform 600ms var(--ease-out) 100ms",
              }}
            >
              {hero.headline}
              <span className="text-[var(--accent-signature)]">.</span>
            </h1>

            {hero.subheadline && (
              <p
                className="mt-4 text-lg sm:text-xl text-muted-foreground"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(12px)",
                  transition:
                    "opacity 600ms var(--ease-out) 200ms, transform 600ms var(--ease-out) 200ms",
                }}
              >
                {hero.subheadline}
              </p>
            )}

            <p
              className="mt-6 text-base leading-relaxed text-muted-foreground max-w-lg"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(12px)",
                transition:
                  "opacity 600ms var(--ease-out) 300ms, transform 600ms var(--ease-out) 300ms",
              }}
            >
              {hero.bio}
            </p>

            {/* CTA Buttons */}
            {ctaButtons.length > 0 && (
              <div
                className="mt-10 flex flex-wrap gap-4"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(12px)",
                  transition:
                    "opacity 600ms var(--ease-out) 400ms, transform 600ms var(--ease-out) 400ms",
                }}
              >
                {ctaButtons.map((btn, i) => {
                  const isPrimary = btn.variant === "primary";
                  const className = isPrimary
                    ? "pressable focus-signature inline-flex items-center px-6 py-3 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
                    : "pressable focus-signature inline-flex items-center px-6 py-3 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors";

                  return btn.type === "resume" ? (
                    <button key={i} onClick={() => setResumeOpen(true)} className={className}>
                      {btn.label}
                    </button>
                  ) : (
                    <Link key={btn.url} href={btn.url} className={className}>
                      {btn.label}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Status indicator */}
            <div
              className="mt-10 flex items-center gap-2"
              style={{
                opacity: mounted ? 1 : 0,
                transition: "opacity 600ms var(--ease-out) 500ms",
              }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-xs text-muted-foreground">Available for new opportunities</span>
            </div>
          </div>

          {/* Interactive 3D blob */}
          <div
            className="hidden lg:block lg:flex-shrink-0 lg:w-[22rem] lg:h-[22rem] relative"
            aria-hidden="true"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
              transition:
                "opacity 800ms var(--ease-out) 600ms, transform 800ms var(--ease-out) 600ms",
            }}
          >
            <div
              className="absolute inset-0 rounded-full opacity-20 dark:opacity-10 blur-3xl -z-10"
              style={{
                background: `radial-gradient(circle, var(--accent-signature), transparent 70%)`,
              }}
            />
            <HeroBlob />
          </div>
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
