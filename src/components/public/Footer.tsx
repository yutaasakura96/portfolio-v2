import { getSiteSettings } from "@/lib/data/public-queries";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import Link from "next/link";

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
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        {/* Main footer content - 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
          {/* Brand column */}
          <div>
            <p className="text-lg font-bold text-foreground mb-3">
              YA
              <span className="text-[var(--accent-signature)]">.</span>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Building thoughtful software for the modern web.
            </p>
          </div>

          {/* Navigation column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Navigation</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link
                href="/projects"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Projects
              </Link>
              <Link
                href="/blog"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Social column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Connect</h3>
            <div className="flex flex-col gap-3">
              {socialLinks.github && (
                <a
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </a>
              )}
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  <span>LinkedIn</span>
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                  <span>Twitter</span>
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row - copyright */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} {siteName}
          </p>
          <p className="text-xs text-muted-foreground">Built with Next.js & TypeScript</p>
        </div>
      </div>
    </footer>
  );
}
