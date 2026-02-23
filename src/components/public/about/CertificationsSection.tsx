import { formatDate } from "@/lib/utils/date-format";
import { Award, ExternalLink } from "lucide-react";
import type { Certification } from "../../../../generated/prisma/client";

interface CertificationsSectionProps {
  certifications: Certification[];
}

export function CertificationsSection({ certifications }: CertificationsSectionProps) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Certifications</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors"
          >
            <div
              className="shrink-0 h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center"
              aria-hidden="true"
            >
              <Award className="h-5 w-5 text-amber-600" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900 leading-snug">{cert.name}</h3>

              <p className="text-sm text-gray-500">{cert.issuer}</p>

              {cert.credentialId && (
                <p className="text-xs text-gray-400 mt-1">ID: {cert.credentialId}</p>
              )}

              <p className="text-xs text-gray-400 mt-1">
                Earned {formatDate(cert.dateEarned, "MMM yyyy")}
                {cert.expirationDate && ` · Expires ${formatDate(cert.expirationDate, "MMM yyyy")}`}
              </p>

              {cert.credentialUrl && (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                >
                  View Credential
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
