"use client";

import { use } from "react";

import { LocaleContext } from "@/components/providers/LocaleProvider";

export function useLocale() {
  return use(LocaleContext);
}
