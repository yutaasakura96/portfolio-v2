"use client";

import { useMutation } from "@tanstack/react-query";
import { Globe, Loader2, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

const ENTITY_LABELS: Record<string, string> = {
  hero: "Hero",
  about: "About",
  settings: "Settings",
  projects: "Projects",
  blog: "Blog Posts",
  experience: "Experience",
  education: "Education",
};

const ENTITY_ORDER = ["hero", "about", "settings", "projects", "blog", "experience", "education"];

const STORAGE_KEY = "translations-last-updated";

function useProgress(isPending: boolean) {
  const [progress, setProgress] = useState(0);
  const wasPending = useRef(false);

  useEffect(() => {
    if (isPending) {
      wasPending.current = true;
      const steps = [
        { at: 0, val: 5 },
        { at: 800, val: 15 },
        { at: 3000, val: 25 },
        { at: 8000, val: 40 },
        { at: 15000, val: 55 },
        { at: 25000, val: 70 },
        { at: 35000, val: 80 },
        { at: 50000, val: 88 },
      ];
      const timers = steps.map(({ at, val }) => setTimeout(() => setProgress(val), at));
      return () => timers.forEach(clearTimeout);
    }
    if (wasPending.current) {
      wasPending.current = false;
      const t1 = setTimeout(() => setProgress(100), 0);
      const t2 = setTimeout(() => setProgress(0), 1500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isPending]);

  return progress;
}

export default function TranslationsPage() {
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });

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
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, now);
      setLastUpdated(now);
      const total = Object.values(data).reduce((a, b) => a + b, 0);
      toast.success(`Translated ${total} items to Japanese`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Translation failed");
    },
  });

  const progress = useProgress(translateMutation.isPending);

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
          <div className="space-y-1 flex-1">
            <h2 className="font-medium text-foreground">Update Japanese Translations</h2>
            <p className="text-sm text-muted-foreground">
              Translates hero, about, settings, projects, blog posts, experience, and education
              content. Existing translations will be overwritten with the latest English content.
            </p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Last updated:{" "}
                <time dateTime={lastUpdated}>{new Date(lastUpdated).toLocaleString()}</time>
              </p>
            )}
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
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Translating content with AI... This may take 30–60 seconds.
            </p>
          </div>
        )}

        {progress === 100 && !translateMutation.isPending && (
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-green-500 w-full transition-all duration-300" />
          </div>
        )}
      </div>

      {result && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h2 className="font-medium text-foreground">Translation Results</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ENTITY_ORDER.map((entity) => {
              const count = result[entity as keyof TranslateResult];
              return (
                <div
                  key={entity}
                  className="rounded-md border border-border bg-background px-3 py-2"
                >
                  <p className="text-xs text-muted-foreground">{ENTITY_LABELS[entity] ?? entity}</p>
                  <p className="text-lg font-semibold text-foreground">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
