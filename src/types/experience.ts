import { ExperienceModel } from "../../generated/prisma/models";

export type Experience = ExperienceModel;

export type ExperienceListResponse = {
  data: Experience[];
  meta: {
    total: number;
  };
};
