-- CreateEnum
CREATE TYPE "base"."CadetStatus" AS ENUM ('ACTIVE', 'RETURNING', 'RETURNED', 'DELETED');

-- CreateEnum
CREATE TYPE "base"."AnonymizationMode" AS ENUM ('MANUAL', 'AFTER_DAYS', 'IMMEDIATELY');

-- AlterTable: add new columns first (before dropping old ones)
ALTER TABLE "base"."cadet"
ADD COLUMN "deleted_at" TIMESTAMP(6),
ADD COLUMN "status" "base"."CadetStatus" NOT NULL DEFAULT 'ACTIVE';

-- DataMigration: set status for soft-deleted cadets
UPDATE "base"."cadet"
SET "status" = 'RETURNED',
    "deleted_at" = "recdelete"
WHERE "recdelete" IS NOT NULL;

-- UpdateView early: replace recdelete IS NULL filter with status = 'ACTIVE' so we can drop the column
CREATE OR REPLACE VIEW "base"."v_cadet_generaloverview" AS
SELECT c.id,
    c.fk_assosiation,
    c.firstname,
    c.lastname,
    ci.fk_inspection,
    ci.uniform_complete AS "uniformComplete",
    i.date AS "lastInspection",
    count(vdbc.id) AS "activeDeficiencyCount"
   FROM base.cadet c
     LEFT JOIN inspection.cadet_inspection ci ON c.id = ci.fk_cadet AND ci.fk_inspection = (( SELECT ii.id
           FROM inspection.inspection ii
             JOIN inspection.cadet_inspection ici ON ii.id = ici.fk_inspection
          WHERE ici.fk_cadet = c.id
          ORDER BY ii.date DESC
         LIMIT 1))
     LEFT JOIN inspection.inspection i ON i.id = ci.fk_inspection
     LEFT JOIN inspection.v_deficiency_by_cadet vdbc ON vdbc.fk_cadet = c.id AND vdbc."dateResolved" IS NULL
  WHERE c.status = 'ACTIVE'
  GROUP BY c.id, ci.fk_inspection, ci.uniform_complete, i.date;

-- AlterTable: now drop the old soft-delete columns
ALTER TABLE "base"."cadet"
DROP COLUMN "active",
DROP COLUMN "recdelete",
DROP COLUMN "recdelete_user";

-- AlterTable: add new config columns
ALTER TABLE "base"."assosiation_configuration"
ADD COLUMN "anonymizationDelayDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "anonymizationMode" "base"."AnonymizationMode" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "returnProcessEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "base"."return_process" (
    "id" TEXT NOT NULL,
    "fk_assosiation" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "base"."return_checklist_template" (
    "id" TEXT NOT NULL,
    "fk_assosiation" CHAR(36) NOT NULL,
    "fk_returnProcess" CHAR(36) NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "return_checklist_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "base"."return_checklist_item_status" (
    "fk_cadet" TEXT NOT NULL,
    "fk_checklistItem" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "return_checklist_item_status_pkey" PRIMARY KEY ("fk_cadet","fk_checklistItem")
);

-- CreateIndex
CREATE INDEX "return_process_fk_assosiation_idx" ON "base"."return_process"("fk_assosiation");

-- CreateIndex
CREATE INDEX "return_checklist_template_fk_returnProcess_idx" ON "base"."return_checklist_template"("fk_returnProcess");

-- CreateIndex
CREATE INDEX "return_checklist_template_fk_assosiation_idx" ON "base"."return_checklist_template"("fk_assosiation");

-- CreateIndex
CREATE INDEX "return_checklist_item_status_fk_checklistItem_idx" ON "base"."return_checklist_item_status"("fk_checklistItem");

-- AddForeignKey
ALTER TABLE "base"."return_process" ADD CONSTRAINT "return_process_fk_assosiation_fkey" FOREIGN KEY ("fk_assosiation") REFERENCES "authentication"."assosiation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base"."return_checklist_template" ADD CONSTRAINT "return_checklist_template_fk_returnProcess_fkey" FOREIGN KEY ("fk_returnProcess") REFERENCES "base"."return_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base"."return_checklist_item_status" ADD CONSTRAINT "return_checklist_item_status_fk_cadet_fkey" FOREIGN KEY ("fk_cadet") REFERENCES "base"."cadet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base"."return_checklist_item_status" ADD CONSTRAINT "return_checklist_item_status_fk_checklistItem_fkey" FOREIGN KEY ("fk_checklistItem") REFERENCES "base"."return_checklist_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
