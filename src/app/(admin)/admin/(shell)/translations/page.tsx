"use client";

import { useMutation } from "@tanstack/react-query";
import { Globe, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";

type TranslateResult = {
  hero: number;
  about: number;
  settings: number;
  projects: number;
  blog: number;
  experience: number;
  education: number;
};

type TranslationTarget = keyof TranslateResult;

const ENTITY_LABELS: Record<string, string> = {
  hero: "Hero",
  about: "About",
  settings: "Settings",
  projects: "Projects",
  blog: "Blog Posts",
  experience: "Experience",
  education: "Education",
};

const ENTITY_ORDER: TranslationTarget[] = [
  "hero",
  "about",
  "settings",
  "projects",
  "blog",
  "experience",
  "education",
];

const STORAGE_KEY = "translations-last-updated";

function emptyResult(): TranslateResult {
  return {
    hero: 0,
    about: 0,
    settings: 0,
    projects: 0,
    blog: 0,
    experience: 0,
    education: 0,
  };
}

export default function TranslationsPage() {
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [activeTarget, setActiveTarget] = useState<TranslationTarget | null>(null);
  const [completedTargets, setCompletedTargets] = useState<TranslationTarget[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  const translateMutation = useMutation({
    mutationFn: async () => {
      const totals = emptyResult();
      setResult(null);
      setCompletedTargets([]);

      for (const target of ENTITY_ORDER) {
        setActiveTarget(target);
        const response = await apiClient.translateContent<
          { target: TranslationTarget },
          TranslateResult
        >({ target });

        for (const entity of ENTITY_ORDER) {
          totals[entity] += response.data[entity];
        }

        setResult({ ...totals });
        setCompletedTargets((current) => [...current, target]);
      }

      setActiveTarget(null);
      return totals;
    },
    onSuccess: (data) => {
      setResult(data);
      setActiveTarget(null);
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, now);
      setLastUpdated(now);
      const total = Object.values(data).reduce((a, b) => a + b, 0);
      toast.success(`Translated ${total} items to Japanese`);
    },
    onError: (error: Error) => {
      setActiveTarget(null);
      toast.error(error.message || "Translation failed");
    },
  });

  const progress = translateMutation.isPending
    ? Math.round((completedTargets.length / ENTITY_ORDER.length) * 100)
    : result
      ? 100
      : 0;

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
              {activeTarget
                ? `Translating ${ENTITY_LABELS[activeTarget] ?? activeTarget}...`
                : "Preparing translations..."}
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
              const count = result[entity];
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
