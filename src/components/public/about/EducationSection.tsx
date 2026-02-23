import { formatDateRange } from "@/lib/utils/date-format";
import { GraduationCap } from "lucide-react";
import type { Education } from "../../../../generated/prisma/client";

interface EducationSectionProps {
  education: Education[];
}

export function EducationSection({ education }: EducationSectionProps) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Education</h2>
      <div className="space-y-4">
        {education.map((edu) => (
          <div
            key={edu.id}
            className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 bg-white"
          >
            <div
              className="shrink-0 h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center"
              aria-hidden="true"
            >
              <GraduationCap className="h-5 w-5 text-gray-500" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900">{edu.degree}</h3>

              <p className="text-sm text-gray-600">{edu.institution}</p>

              <p className="text-sm text-gray-500">{edu.field}</p>

              <p className="text-sm text-gray-400 mt-1">
                {formatDateRange(edu.startDate, edu.endDate, "yyyy")}
              </p>

              {edu.achievements && (
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{edu.achievements}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
