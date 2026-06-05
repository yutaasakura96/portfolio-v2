"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExpiringCertification } from "@/hooks/use-dashboard-stats";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

type CertificationAlertsProps = {
  certs: ExpiringCertification[];
};

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function CertificationAlerts({ certs }: CertificationAlertsProps) {
  if (certs.length === 0) return null;

  return (
    <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          Expiring Certifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {certs.map((cert) => {
            const days = daysUntil(cert.expirationDate);
            const expired = days < 0;
            return (
              <li key={cert.id} className="text-sm">
                <Link href="/admin/certifications" className="hover:underline">
                  <span className="font-medium text-foreground">{cert.name}</span>
                  <span className="text-muted-foreground"> by {cert.issuer} — </span>
                  <span
                    className={
                      expired
                        ? "font-medium text-destructive"
                        : "text-amber-700 dark:text-amber-400"
                    }
                  >
                    {expired ? `expired ${Math.abs(days)}d ago` : `expires in ${days}d`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
