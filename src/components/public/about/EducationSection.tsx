"use client";

import { DocumentModal } from "@/components/public/DocumentModal";
import { formatDateRange } from "@/lib/utils/date-format";
import { FileText, GraduationCap } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { Education } from "../../../../generated/prisma/client";

interface EducationSectionProps {
  education: Education[];
}

export function EducationSection({ education }: EducationSectionProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);

  const handleImageError = (eduId: string) => {
    setFailedImages((prev) => new Set(prev).add(eduId));
  };

  const openDoc = education.find((e) => e.id === openDocumentId);

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Education</h2>
      <div className="space-y-4">
        {education.map((edu) => {
          const shouldShowImage = edu.logoUrl && !failedImages.has(edu.id);

          return (
            <div
              key={edu.id}
              className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 bg-white"
            >
              <div
                className="shrink-0 h-10 w-10 rounded-lg bg-transparent flex items-center justify-center overflow-hidden"
                aria-hidden="true"
              >
                {shouldShowImage ? (
                  <Image
                    src={edu.logoUrl ?? ""}
                    alt={`${edu.institution} logo`}
                    width={40}
                    height={40}
                    className="object-contain"
                    onError={() => handleImageError(edu.id)}
                  />
                ) : (
                  <GraduationCap className="h-5 w-5 text-gray-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  {edu.institutionUrl ? (
                    <a
                      href={edu.institutionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                    >
                      {edu.institution}
                    </a>
                  ) : (
                    edu.institution
                  )}
                </h3>

                <p className="text-sm text-gray-600">{edu.degree}</p>

                {edu.field && <p className="text-sm text-gray-500">{edu.field}</p>}

                <p className="text-sm text-gray-400 mt-1">
                  {formatDateRange(edu.startDate, edu.endDate, "yyyy")}
                </p>

                {edu.achievements && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{edu.achievements}</p>
                )}

                {edu.documentUrl && (
                  <button
                    type="button"
                    onClick={() => setOpenDocumentId(edu.id)}
                    className="inline-flex items-center gap-1.5 mt-3 text-xs text-gray-500 hover:text-gray-800 hover:underline focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 rounded"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    View Credentials
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {openDoc?.documentUrl && (
        <DocumentModal
          open={!!openDocumentId}
          onClose={() => setOpenDocumentId(null)}
          documentUrl={openDoc.documentUrl}
        />
      )}
    </section>
  );
}
