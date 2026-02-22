import { ProjectModel } from "../../generated/prisma/models";
import { ProjectStatus } from "../../generated/prisma/enums";

export type Project = ProjectModel;

export type ProjectListItem = Pick<
  Project,
  | "id"
  | "title"
  | "shortDescription"
  | "status"
  | "featured"
  | "slug"
  | "thumbnailImage"
  | "displayOrder"
>;

export type ProjectWithDetails = Project;

export { ProjectStatus };
