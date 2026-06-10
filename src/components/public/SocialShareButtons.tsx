"use client";

import { useLocale } from "@/hooks/use-locale";
import { ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Facebook, Link, Linkedin, Twitter } from "lucide-react";
import { toast } from "sonner";

interface SocialShareButtonsProps {
  url: string;
  title: string;
  className?: string;
}

const platforms = [
  {
    name: "LinkedIn",
    icon: Linkedin,
    href: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: "Facebook",
    icon: Facebook,
    href: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "X",
    icon: Twitter,
    href: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
] as const;

export default function SocialShareButtons({ url, title, className }: SocialShareButtonsProps) {
  const { locale } = useLocale();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(ui("linkCopied", locale));
    } catch {
      toast.error(ui("copyFailed", locale));
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="mr-2 text-sm text-muted-foreground">{ui("share", locale)}</span>
      {platforms.map((platform) => (
        <a
          key={platform.name}
          href={platform.href(url, title)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${platform.name}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <platform.icon className="h-4 w-4" />
        </a>
      ))}
      <button
        onClick={copyLink}
        aria-label="Copy link"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Link className="h-4 w-4" />
      </button>
    </div>
  );
}
