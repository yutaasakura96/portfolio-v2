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
    <footer className="border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="flex flex-col items-center gap-6">
          {/* Logo mark */}
          <p className="text-lg font-bold text-foreground">
            YA
            <span className="text-[var(--accent-signature)]">.</span>
          </p>

          {/* Social links */}
          <div className="flex items-center gap-5">
            {socialLinks.github && (
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable text-muted-foreground hover:text-foreground transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            )}
            {socialLinks.linkedin && (
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable text-muted-foreground hover:text-foreground transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            )}
            {socialLinks.twitter && (
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable text-muted-foreground hover:text-foreground transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="pressable text-muted-foreground hover:text-foreground transition-colors duration-200"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            )}
          </div>

          {/* Divider */}
          <div className="w-12 h-px bg-border" />

          <p className="text-xs text-muted-foreground">
            © {currentYear} {siteName}
          </p>
        </div>
      </div>
    </footer>
  );
}
