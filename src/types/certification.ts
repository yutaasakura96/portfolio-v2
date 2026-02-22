import { CertificationModel } from "../../generated/prisma/models";

export type Certification = CertificationModel;

export type CertificationListResponse = {
  data: Certification[];
  meta: {
    total: number;
  };
};
