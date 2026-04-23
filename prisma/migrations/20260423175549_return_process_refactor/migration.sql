/*
  Warnings:

  - The primary key for the `return_checklist_item_status` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `completed` on the `return_checklist_item_status` table. All the data in the column will be lost.
  - You are about to drop the column `fk_cadet` on the `return_checklist_item_status` table. All the data in the column will be lost.
  - You are about to alter the column `fk_checklistItem` on the `return_checklist_item_status` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to drop the column `fk_returnProcess` on the `return_checklist_template` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `return_process` table. All the data in the column will be lost.
  - Added the required column `fk_returnProcess` to the `return_checklist_item_status` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fk_returnProcessTemplate` to the `return_checklist_template` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fk_cadet` to the `return_process` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fk_returnProcessTemplate` to the `return_process` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "base"."return_checklist_item_status" DROP CONSTRAINT "return_checklist_item_status_fk_cadet_fkey";

-- DropForeignKey
ALTER TABLE "base"."return_checklist_item_status" DROP CONSTRAINT "return_checklist_item_status_fk_checklistItem_fkey";

-- DropForeignKey
ALTER TABLE "base"."return_checklist_template" DROP CONSTRAINT "return_checklist_template_fk_returnProcess_fkey";

-- DropIndex
DROP INDEX "base"."return_checklist_template_fk_returnProcess_idx";

-- AlterTable
ALTER TABLE "base"."return_checklist_item_status" DROP CONSTRAINT "return_checklist_item_status_pkey",
DROP COLUMN "completed",
DROP COLUMN "fk_cadet",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedByUser" VARCHAR(10),
ADD COLUMN     "fk_returnProcess" CHAR(36) NOT NULL,
ALTER COLUMN "fk_checklistItem" SET DATA TYPE CHAR(36),
ADD CONSTRAINT "return_checklist_item_status_pkey" PRIMARY KEY ("fk_returnProcess", "fk_checklistItem");

-- AlterTable
ALTER TABLE "base"."return_checklist_template" DROP COLUMN "fk_returnProcess",
ADD COLUMN     "fk_returnProcessTemplate" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "base"."return_process" DROP COLUMN "name",
ADD COLUMN     "finished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fk_cadet" CHAR(36) NOT NULL,
ADD COLUMN     "fk_returnProcessTemplate" CHAR(36) NOT NULL,
ADD COLUMN     "inspectorComment" TEXT;

-- CreateTable
CREATE TABLE "base"."return_process_template" (
    "id" TEXT NOT NULL,
    "fk_assosiation" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "defaultProcess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_process_template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "return_process_template_fk_assosiation_idx" ON "base"."return_process_template"("fk_assosiation");

-- CreateIndex
CREATE INDEX "return_checklist_template_fk_returnProcessTemplate_idx" ON "base"."return_checklist_template"("fk_returnProcessTemplate");

-- CreateIndex
CREATE INDEX "return_process_fk_cadet_idx" ON "base"."return_process"("fk_cadet");

-- AddForeignKey
ALTER TABLE "base"."return_process_template" ADD CONSTRAINT "return_process_template_fk_assosiation_fkey" FOREIGN KEY ("fk_assosiation") REFERENCES "authentication"."assosiation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base"."return_process" ADD CONSTRAINT "return_process_fk_cadet_fkey" FOREIGN KEY ("fk_cadet") REFERENCES "base"."cadet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base"."return_process" ADD CONSTRAINT "return_process_fk_returnProcessTemplate_fkey" FOREIGN KEY ("fk_returnProcessTemplate") REFERENCES "base"."return_process_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base"."return_checklist_template" ADD CONSTRAINT "return_checklist_template_fk_returnProcessTemplate_fkey" FOREIGN KEY ("fk_returnProcessTemplate") REFERENCES "base"."return_process_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base"."return_checklist_item_status" ADD CONSTRAINT "return_checklist_item_status_fk_returnProcess_fkey" FOREIGN KEY ("fk_returnProcess") REFERENCES "base"."return_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base"."return_checklist_item_status" ADD CONSTRAINT "return_checklist_item_status_fk_checklistItem_fkey" FOREIGN KEY ("fk_checklistItem") REFERENCES "base"."return_checklist_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
