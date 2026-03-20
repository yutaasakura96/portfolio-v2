"use client";

import { useState } from "react";
import { CertificateImageModal } from "@/components/public/CertificateImageModal";
import { formatDate } from "@/lib/utils/date-format";
import { Award, ExternalLink, ImageIcon } from "lucide-react";
import type { Certification } from "../../../../generated/prisma/client";

interface CertificationsSectionProps {
  certifications: Certification[];
}

export function CertificationsSection({ certifications }: CertificationsSectionProps) {
  const [certModal, setCertModal] = useState({ open: false, url: "", name: "" });

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

              {(cert.credentialUrl || cert.certificateImage) && (
                <div className="flex flex-col items-start gap-1 mt-2">
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 hover:underline focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 rounded"
                    >
                      View Credential
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {cert.certificateImage && (
                    <button
                      type="button"
                      onClick={() =>
                        setCertModal({ open: true, url: cert.certificateImage!, name: cert.name })
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 hover:underline focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 rounded"
                    >
                      View Certificate
                      <ImageIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <CertificateImageModal
        open={certModal.open}
        onClose={() => setCertModal({ open: false, url: "", name: "" })}
        imageUrl={certModal.url}
        certName={certModal.name}
      />
    </section>
  );
}
