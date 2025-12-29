/*
  Warnings:

  - You are about to drop the column `active` on the `uniform` table. All the data in the column will be lost.
  - You are about to drop the column `outdated` on the `uniform_generation` table. All the data in the column will be lost.

*/
-- ADD COLUMNS
ALTER TABLE "base"."uniform" ADD COLUMN "isReserve" BOOLEAN NOT NULL DEFAULT false;
UPDATE "base"."uniform" SET "isReserve" = NOT "active";
ALTER TABLE "base"."uniform" DROP COLUMN "active";

-- RENAME COLUMN
ALTER TABLE "base"."uniform_generation" RENAME COLUMN "outdated" TO "isReserve";
