/*
  Warnings:

  - You are about to alter the column `title` on the `BlogPost` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - You are about to alter the column `excerpt` on the `BlogPost` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.

*/
-- AlterTable
ALTER TABLE "BlogPost" ALTER COLUMN "title" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "excerpt" SET DATA TYPE VARCHAR(500);
