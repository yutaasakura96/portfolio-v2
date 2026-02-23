import { CertificationsSection } from "@/components/public/about/CertificationsSection";
import { EducationSection } from "@/components/public/about/EducationSection";
import { ExperienceSection } from "@/components/public/about/ExperienceSection";
import { SkillsSection } from "@/components/public/about/SkillsSection";
import {
  getCertifications,
  getEducation,
  getExperiences,
  getSkills,
} from "@/lib/data/public-queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about my skills, experience, education, and certifications.",
};

// Revalidate daily (86400 seconds = 24 hours)
export const revalidate = 86400;

export default async function AboutPage() {
  // Fetch all about page data in parallel for optimal performance
  const [skills, experiences, education, certifications] = await Promise.all([
    getSkills(),
    getExperiences(),
    getEducation(),
    getCertifications(),
  ]);

  // Check if there's any content to display
  const hasContent =
    skills.length > 0 ||
    experiences.length > 0 ||
    education.length > 0 ||
    certifications.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900">About Me</h1>
        <p className="mt-2 text-gray-600">
          My skills, professional experience, education, and certifications.
        </p>
      </div>

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
