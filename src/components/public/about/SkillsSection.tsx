import type { ProficiencyLevel, Skill } from "../../../../generated/prisma/client";

interface SkillsSectionProps {
  skills: Skill[];
}

// Type-safe proficiency color mapping using the actual Prisma enum
const proficiencyColors: Record<ProficiencyLevel, string> = {
  EXPERT: "bg-green-100 text-green-800 border-green-200",
  ADVANCED: "bg-blue-100 text-blue-800 border-blue-200",
  INTERMEDIATE: "bg-yellow-100 text-yellow-800 border-yellow-200",
  BEGINNER: "bg-gray-100 text-gray-700 border-gray-200",
};

// Default style for skills without proficiency level
const defaultStyle = "bg-gray-100 text-gray-700 border-gray-200";

/**
 * Format proficiency level for display (e.g., "EXPERT" -> "Expert")
 */
function formatProficiency(level: ProficiencyLevel): string {
  return level.charAt(0) + level.slice(1).toLowerCase();
}

export function SkillsSection({ skills }: SkillsSectionProps) {
  // Group skills by category
  const grouped = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const category = skill.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {});

  // Sort categories alphabetically for consistent display
  const sortedCategories = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sortedCategories.map(([category, categorySkills]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {category}
            </h3>
            <div className="flex flex-wrap gap-2">
              {categorySkills.map((skill) => {
                const colorClass = skill.proficiencyLevel
                  ? proficiencyColors[skill.proficiencyLevel]
                  : defaultStyle;

                return (
                  <span
                    key={skill.id}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${colorClass}`}
                    title={
                      skill.proficiencyLevel ? formatProficiency(skill.proficiencyLevel) : undefined
                    }
                  >
                    {skill.icon && (
                      <span className="mr-1.5" aria-hidden="true">
                        {skill.icon}
                      </span>
                    )}
                    {skill.name}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
