"use client";

import { useLocale } from "@/hooks/use-locale";
import { t, tArray, ui } from "@/lib/i18n";
import { formatDateRange } from "@/lib/utils/date-format";
import Image from "next/image";
import { useState } from "react";
import type { Experience } from "../../../../generated/prisma/client";

interface ExperienceSectionProps {
  experiences: Experience[];
}

export function ExperienceSection({ experiences }: ExperienceSectionProps) {
  const { locale } = useLocale();
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (expId: string) => {
    setFailedImages((prev) => new Set(prev).add(expId));
  };

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-foreground mb-6">{ui("experience", locale)}</h2>
      <div className="space-y-0">
        {experiences.map((exp, index) => {
          const shouldShowImage = exp.logoUrl && !failedImages.has(exp.id);

          return (
            <div key={exp.id} className="relative pl-8 pb-8 last:pb-0">
              {/* Timeline line */}
              {index < experiences.length - 1 && (
                <div
                  className="absolute left-[11px] top-3 bottom-0 w-px bg-border"
                  aria-hidden="true"
                />
              )}

              {/* Timeline dot */}
              <div
                className="absolute left-0 top-1.5 h-[22px] w-[22px] rounded-full border-2 border-border bg-card"
                aria-hidden="true"
              />

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">
                      {exp.companyUrl ? (
                        <a
                          href={exp.companyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                        >
                          {exp.company}
                        </a>
                      ) : (
                        exp.company
                      )}
                    </h3>

                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {t(exp, "role", locale)}
                    </p>

                    {exp.location && (
                      <p className="text-sm text-muted-foreground mt-0.5">{exp.location}</p>
                    )}

                    <p className="text-sm text-muted-foreground mt-0.5">
                      {formatDateRange(exp.startDate, exp.endDate)}
                    </p>

                    {t(exp, "description", locale) && (
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                        {t(exp, "description", locale)}
                      </p>
                    )}

                    {/* Highlights */}
                    {tArray(exp, "highlights", locale).length > 0 && (
                      <ul className="mt-3 space-y-1.5" role="list">
                        {tArray(exp, "highlights", locale).map((highlight, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50"
                              aria-hidden="true"
                            />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Tech Tags */}
                    {exp.techTags && exp.techTags.length > 0 && (
                      <div className="mt-3">
                        <span className="text-xs text-muted-foreground font-medium">
                          Technologies Used:
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {[...new Set(exp.techTags)].map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Company Logo */}
                  {shouldShowImage && (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-transparent">
                      <Image
                        src={exp.logoUrl ?? ""}
                        alt={`${exp.company} logo`}
                        fill
                        className="object-contain"
                        sizes="56px"
                        onError={() => handleImageError(exp.id)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
