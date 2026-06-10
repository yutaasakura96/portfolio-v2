"use client";

import { useLocale } from "@/hooks/use-locale";
import { useReveal } from "@/hooks/use-reveal";
import { ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  const { locale } = useLocale();
  const { ref, visible } = useReveal();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={cn("reveal py-14 sm:py-16 section-alt-bg", visible && "visible")}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative rounded-2xl border border-border bg-card p-10 sm:p-14 overflow-hidden">
          {/* Background accent */}
          <div
            className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full opacity-[0.06] dark:opacity-[0.03] blur-3xl pointer-events-none"
            style={{
              background: `radial-gradient(circle, var(--accent-signature), transparent 70%)`,
            }}
            aria-hidden="true"
          />

          <div className="relative max-w-xl">
            <p className="text-sm font-medium text-[var(--accent-signature)] mb-2">
              {ui("getInTouch", locale)}
            </p>
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {ui("getInTouchDescription", locale)}
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {ui("contactDescription", locale)}
            </p>
            <Link
              href="/contact"
              className="pressable focus-signature arrow-link mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              {ui("contactMe", locale)}
              <ArrowRight className="h-4 w-4 arrow-icon" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
