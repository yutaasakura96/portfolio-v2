import { SkillModel } from "../../generated/prisma/models";
import { ProficiencyLevel } from "../../generated/prisma/enums";

export type Skill = SkillModel;

export type SkillsGroupedResponse = {
  data: Record<string, Skill[]>;
  meta: {
    total: number;
  };
};

export type SkillsListResponse = {
  data: Skill[];
  meta: {
    total: number;
  };
};

export { ProficiencyLevel };
