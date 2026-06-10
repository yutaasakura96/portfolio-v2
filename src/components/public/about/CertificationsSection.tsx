"use client";

import { useState } from "react";
import { CertificateImageModal } from "@/components/public/CertificateImageModal";
import { useLocale } from "@/hooks/use-locale";
import { ui } from "@/lib/i18n";
import { formatDate } from "@/lib/utils/date-format";
import { Award, ExternalLink, ImageIcon } from "lucide-react";
import Image from "next/image";
import type { Certification } from "../../../../generated/prisma/client";

interface CertificationsSectionProps {
  certifications: Certification[];
}

export function CertificationsSection({ certifications }: CertificationsSectionProps) {
  const { locale } = useLocale();
  const [certModal, setCertModal] = useState({ open: false, url: "", name: "" });

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-foreground mb-6">{ui("certifications", locale)}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card hover:border-ring transition-colors"
          >
            <div
              className="shrink-0 h-10 w-10 rounded-lg bg-transparent flex items-center justify-center overflow-hidden"
              aria-hidden="true"
            >
              {cert.badgeImage ? (
                <Image
                  src={cert.badgeImage}
                  alt={`${cert.name} badge`}
                  width={40}
                  height={40}
                  className="object-contain w-full h-full"
                />
              ) : (
                <Award className="h-5 w-5 text-amber-600" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground leading-snug">{cert.name}</h3>

              <p className="text-sm text-muted-foreground">{cert.issuer}</p>

              {cert.credentialId && (
                <p className="text-xs text-muted-foreground mt-1">ID: {cert.credentialId}</p>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                {ui("earned", locale)} {formatDate(cert.dateEarned, "MMM yyyy")}
                {cert.expirationDate &&
                  ` · ${ui("expires", locale)} ${formatDate(cert.expirationDate, "MMM yyyy")}`}
              </p>

              {(cert.credentialUrl || cert.certificateImage) && (
                <div className="flex flex-row items-center justify-between gap-2 mt-2 w-full">
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                    >
                      {ui("viewCredential", locale)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {cert.certificateImage && (
                    <button
                      type="button"
                      onClick={() =>
                        setCertModal({ open: true, url: cert.certificateImage!, name: cert.name })
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded cursor-pointer"
                    >
                      {ui("viewCertificate", locale)}
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
