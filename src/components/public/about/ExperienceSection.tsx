"use client";

import { formatDateRange } from "@/lib/utils/date-format";
import Image from "next/image";
import { useState } from "react";
import type { Experience } from "../../../../generated/prisma/client";

interface ExperienceSectionProps {
  experiences: Experience[];
}

export function ExperienceSection({ experiences }: ExperienceSectionProps) {
  // Track failed image loads to hide them gracefully
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (expId: string) => {
    setFailedImages((prev) => new Set(prev).add(expId));
  };

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Experience</h2>
      <div className="space-y-0">
        {experiences.map((exp, index) => {
          const shouldShowImage = exp.logoUrl && !failedImages.has(exp.id);

          return (
            <div key={exp.id} className="relative pl-8 pb-8 last:pb-0">
              {/* Timeline line */}
              {index < experiences.length - 1 && (
                <div
                  className="absolute left-[11px] top-3 bottom-0 w-px bg-gray-200"
                  aria-hidden="true"
                />
              )}

              {/* Timeline dot */}
              <div
                className="absolute left-0 top-1.5 h-[22px] w-[22px] rounded-full border-2 border-gray-300 bg-white"
                aria-hidden="true"
              />

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start gap-4">
                  {/* Company Logo */}
                  {shouldShowImage && (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={exp.logoUrl ?? ""}
                        alt={`${exp.company} logo`}
                        fill
                        className="object-contain p-1"
                        sizes="40px"
                        onError={() => handleImageError(exp.id)}
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">{exp.role}</h3>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-sm text-gray-600">
                        {exp.companyUrl ? (
                          <a
                            href={exp.companyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                          >
                            {exp.company}
                          </a>
                        ) : (
                          exp.company
                        )}
                      </span>

                      {exp.location && (
                        <span className="text-sm text-gray-400">{exp.location}</span>
                      )}
                    </div>

                    <p className="text-sm text-gray-400 mt-1">
                      {formatDateRange(exp.startDate, exp.endDate)}
                    </p>

                    {exp.description && (
                      <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                        {exp.description}
                      </p>
                    )}

                    {/* Highlights */}
                    {exp.highlights && exp.highlights.length > 0 && (
                      <ul className="mt-3 space-y-1.5" role="list">
                        {exp.highlights.map((highlight, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300"
                              aria-hidden="true"
                            />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
