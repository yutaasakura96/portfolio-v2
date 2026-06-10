-- AlterTable
ALTER TABLE "AboutPage" ADD COLUMN     "headingJa" VARCHAR(200),
ADD COLUMN     "introBioJa" TEXT,
ADD COLUMN     "introHeadlineJa" VARCHAR(200),
ADD COLUMN     "profileTitleJa" VARCHAR(150),
ADD COLUMN     "subheadingJa" VARCHAR(500);

-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "contentJa" TEXT,
ADD COLUMN     "excerptJa" VARCHAR(500),
ADD COLUMN     "titleJa" VARCHAR(200);

-- AlterTable
ALTER TABLE "Education" ADD COLUMN     "achievementsJa" TEXT,
ADD COLUMN     "degreeJa" TEXT;

-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "descriptionJa" TEXT,
ADD COLUMN     "highlightsJa" TEXT[],
ADD COLUMN     "roleJa" TEXT;

-- AlterTable
ALTER TABLE "Hero" ADD COLUMN     "bioJa" TEXT,
ADD COLUMN     "ctaButtonsJa" JSONB,
ADD COLUMN     "headlineJa" VARCHAR(200),
ADD COLUMN     "subheadlineJa" VARCHAR(300);

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "descriptionJa" TEXT,
ADD COLUMN     "problemJa" TEXT,
ADD COLUMN     "roleJa" TEXT,
ADD COLUMN     "shortDescriptionJa" VARCHAR(500),
ADD COLUMN     "solutionJa" TEXT,
ADD COLUMN     "titleJa" VARCHAR(200);

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "siteDescriptionJa" VARCHAR(500);
