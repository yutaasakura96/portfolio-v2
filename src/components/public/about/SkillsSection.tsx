"use client";

import type { Skill } from "../../../../generated/prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench } from "lucide-react";

interface SkillsSectionProps {
  skills: Skill[];
  categoryOrder?: string[];
}

function SkillCard({ skill }: { skill: Skill }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-center transition-all hover:border-gray-300 hover:shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center">
        {skill.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={skill.iconUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="h-7 w-7 object-contain"
          />
        ) : skill.icon ? (
          <span className="text-2xl leading-none" aria-hidden="true">
            {skill.icon}
          </span>
        ) : (
          <Wrench className="h-5 w-5 text-gray-400" aria-hidden="true" />
        )}
      </div>
      <span className="w-full text-wrap text-center text-xs font-medium text-gray-700">
        {skill.name}
      </span>
    </div>
  );
}

export function SkillsSection({ skills, categoryOrder }: SkillsSectionProps) {
  const grouped = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const category = skill.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {});

  const sortedCategories = Object.entries(grouped).sort(([a], [b]) => {
    if (!categoryOrder?.length) return a.localeCompare(b);
    const ia = categoryOrder.indexOf(a);
    const ib = categoryOrder.indexOf(b);
    return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
  });

  if (sortedCategories.length === 0) return null;

  const defaultTab = sortedCategories[0][0];

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills</h2>
      <Tabs defaultValue={defaultTab}>
        <TabsList
          variant="line"
          className="mb-6 w-full justify-start overflow-x-auto border-b border-gray-200 pb-0"
        >
          {sortedCategories.map(([category]) => (
            <TabsTrigger
              key={category}
              value={category}
              className="shrink-0 whitespace-nowrap px-3 py-2 text-sm"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        {sortedCategories.map(([category, categorySkills]) => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {categorySkills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
