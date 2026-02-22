import { EducationModel } from "../../generated/prisma/models";

export type Education = EducationModel;

export type EducationListResponse = {
  data: Education[];
  meta: {
    total: number;
  };
};
