"use client";

import { createContext, useCallback, useEffect, useSyncExternalStore } from "react";

import type { Locale } from "@/lib/locale";
import { DEFAULT_LOCALE } from "@/lib/locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

const STORAGE_KEY = "locale";

let listeners: Array<() => void> = [];

function subscribe(cb: () => void): () => void {
  listeners = [...listeners, cb];
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function getSnapshot(): Locale {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "ja" || v === "en" ? v : DEFAULT_LOCALE;
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    listeners.forEach((l) => l());
  }, []);

  return <LocaleContext value={{ locale, setLocale }}>{children}</LocaleContext>;
}
