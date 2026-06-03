"use client";

import type { Hero } from "@/lib/data/types";
import Link from "next/link";
import { useEffect, useState } from "react";
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

          {/* Decorative code block */}
          <div
            className="hidden lg:block lg:flex-shrink-0 lg:w-72"
            aria-hidden="true"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transition:
                "opacity 800ms var(--ease-out) 600ms, transform 800ms var(--ease-out) 600ms",
            }}
          >
            <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5 font-mono text-xs leading-relaxed shadow-lg">
              <div className="flex items-center gap-1.5 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "oklch(from var(--accent-signature) l c h / 0.6)" }}
                />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="space-y-1 text-muted-foreground">
                <p>
                  <span className="text-[var(--accent-signature)]">const</span>{" "}
                  <span className="text-foreground">developer</span> = {"{"}
                </p>
                <p className="pl-4">
                  name:{" "}
                  <span className="text-green-600 dark:text-green-400">
                    &quot;Yuta Asakura&quot;
                  </span>
                  ,
                </p>
                <p className="pl-4">
                  role:{" "}
                  <span className="text-green-600 dark:text-green-400">&quot;Full-Stack&quot;</span>
                  ,
                </p>
                <p className="pl-4">stack: [</p>
                <p className="pl-8">
                  <span className="text-green-600 dark:text-green-400">&quot;Next.js&quot;</span>,
                </p>
                <p className="pl-8">
                  <span className="text-green-600 dark:text-green-400">&quot;TypeScript&quot;</span>
                  ,
                </p>
                <p className="pl-8">
                  <span className="text-green-600 dark:text-green-400">&quot;AWS&quot;</span>,
                </p>
                <p className="pl-4">],</p>
                <p className="pl-4">
                  open: <span className="text-[var(--accent-signature)]">true</span>,
                </p>
                <p>{"}"}</p>
              </div>
            </div>
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
