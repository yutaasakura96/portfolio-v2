"use client";

import DOMPurify from "isomorphic-dompurify";
import { useLocale } from "@/hooks/use-locale";
import { ui } from "@/lib/i18n";
import type { UIStringKey } from "@/lib/i18n";

interface LocalizedTextProps {
  en: string;
  ja?: string | null;
  as?: "h1" | "h2" | "p" | "span" | "div";
  className?: string;
}

export function LocalizedText({ en, ja, as: Tag = "span", className }: LocalizedTextProps) {
  const { locale } = useLocale();
  const text = locale === "ja" && ja?.trim() ? ja : en;
  return <Tag className={className}>{text}</Tag>;
}

interface LocalizedHtmlProps {
  enHtml: string;
  jaHtml?: string | null;
  className?: string;
}

export function LocalizedHtml({ enHtml, jaHtml, className }: LocalizedHtmlProps) {
  const { locale } = useLocale();
  const html = locale === "ja" && jaHtml?.trim() ? jaHtml : enHtml;
  const sanitized = DOMPurify.sanitize(html);
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

interface LocalizedUiProps {
  k: UIStringKey;
  as?: "h1" | "h2" | "p" | "span" | "div";
  className?: string;
}

export function LocalizedUi({ k, as: Tag = "span", className }: LocalizedUiProps) {
  const { locale } = useLocale();
  return <Tag className={className}>{ui(k, locale)}</Tag>;
}
