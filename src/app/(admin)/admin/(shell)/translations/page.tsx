"use client";

import { useMutation } from "@tanstack/react-query";
import { Globe, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type TranslateResult = {
  hero: number;
  about: number;
  settings: number;
  projects: number;
  blog: number;
  experience: number;
  education: number;
};

export default function TranslationsPage() {
  const [result, setResult] = useState<TranslateResult | null>(null);

  const translateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message || "Translation failed");
      }
      const json = (await res.json()) as { data: TranslateResult };
      return json.data;
    },
    onSuccess: (data) => {
      setResult(data);
      const total = Object.values(data).reduce((a, b) => a + b, 0);
      toast.success(`Translated ${total} items to Japanese`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Translation failed");
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Translations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Translate all English content to Japanese using AI. This reads your current content and
          generates Japanese translations for the public site.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-accent p-2">
            <Globe className="h-5 w-5 text-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="font-medium text-foreground">Update Japanese Translations</h2>
            <p className="text-sm text-muted-foreground">
              Translates hero, about, settings, projects, blog posts, experience, and education
              content. Existing translations will be overwritten with the latest English content.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => translateMutation.mutate()}
          disabled={translateMutation.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {translateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Translating...
            </>
          ) : (
            "Update Japanese"
          )}
        </button>

        {translateMutation.isPending && (
          <p className="text-sm text-muted-foreground">
            This may take 30-60 seconds. Each entity type is translated separately.
          </p>
        )}
      </div>

      {result && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-medium text-foreground mb-4">Translation Results</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(result).map(([entity, count]) => (
              <div key={entity} className="rounded-md border border-border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground capitalize">{entity}</p>
                <p className="text-lg font-semibold text-foreground">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
