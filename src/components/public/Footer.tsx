import { getSiteSettings } from "@/lib/data/public-queries";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";

type SocialLinks = {
  github?: string;
  linkedin?: string;
  twitter?: string;
};

export async function Footer() {
  let settings = null;
  let socialLinks: SocialLinks = {};

  try {
    settings = await getSiteSettings();
    socialLinks = (settings?.socialLinks as SocialLinks) ?? {};
  } catch (error) {
    console.error("Failed to fetch site settings for footer:", error);
  }

  const currentYear = new Date().getFullYear();
  const siteName = settings?.siteName ?? "Yuta Asakura";
  const email = settings?.email;

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-bold text-foreground">
              YA
              <span className="text-[var(--accent-signature)]">.</span>
            </span>
            <span className="text-xs">
              &copy; {currentYear} {siteName}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {socialLinks.github && (
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            )}
            {socialLinks.linkedin && (
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {socialLinks.twitter && (
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
