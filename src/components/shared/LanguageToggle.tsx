"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { locale, setLocale } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "ja" : "en")}
      aria-label={mounted && locale === "ja" ? "Switch to English" : "日本語に切り替え"}
      className={cn(
        "pressable rounded-md px-2 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
        className
      )}
    >
      {mounted ? (locale === "en" ? "JA" : "EN") : "JA"}
    </button>
  );
}
