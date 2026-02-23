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
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {currentYear} {siteName}. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            {socialLinks.github && (
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
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
                className="text-gray-400 hover:text-gray-600 transition-colors"
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
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
