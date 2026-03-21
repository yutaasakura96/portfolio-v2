import { AboutProfileSection } from "@/components/public/about/AboutProfileSection";
import { CertificationsSection } from "@/components/public/about/CertificationsSection";
import { EducationSection } from "@/components/public/about/EducationSection";
import { ExperienceSection } from "@/components/public/about/ExperienceSection";
import { SkillsSection } from "@/components/public/about/SkillsSection";
import {
  getAboutPageIntro,
  getCertifications,
  getEducation,
  getExperiences,
  getHero,
  getSkills,
  getSiteSettings,
} from "@/lib/data/public-queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Yuta Asakura's background, skills, experience, and education in full-stack web development.",
};

// Revalidate daily (86400 seconds = 24 hours)
export const revalidate = 86400;

const DEFAULT_HEADING = "About Me";
const DEFAULT_SUBHEADING = "My skills, professional experience, education, and certifications.";

type SocialLinks = {
  github?: string;
  linkedin?: string;
};

export default async function AboutPage() {
  // Fetch all about page data in parallel for optimal performance
  const [intro, skills, experiences, education, certifications, hero, siteSettings] =
    await Promise.all([
      getAboutPageIntro(),
      getSkills(),
      getExperiences(),
      getEducation(),
      getCertifications(),
      getHero(),
      getSiteSettings(),
    ]);

  // Check if there's any content to display
  const hasContent =
    skills.length > 0 ||
    experiences.length > 0 ||
    education.length > 0 ||
    certifications.length > 0;

  const hasProfileSection = intro && (intro.profileName || intro.introHeadline || intro.introBio);

  const socialLinks = (siteSettings?.socialLinks as SocialLinks) ?? {};

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900">{intro?.heading ?? DEFAULT_HEADING}</h1>
        <p className="mt-2 text-gray-600">{intro?.subheading ?? DEFAULT_SUBHEADING}</p>
      </div>

      {hasProfileSection && (
        <AboutProfileSection
          intro={intro}
          profileImage={intro?.profileImageUrl ?? hero?.profileImage}
          email={siteSettings?.email}
          socialLinks={socialLinks}
        />
      )}

      {!hasContent ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Content coming soon.</p>
        </div>
      ) : (
        <>
          {skills.length > 0 && <SkillsSection skills={skills} />}
          {experiences.length > 0 && <ExperienceSection experiences={experiences} />}
          {education.length > 0 && <EducationSection education={education} />}
          {certifications.length > 0 && <CertificationsSection certifications={certifications} />}
        </>
      )}
    </div>
  );
}
