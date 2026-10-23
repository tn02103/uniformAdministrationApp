-- CreateEnum
CREATE TYPE "base"."CadetStatus" AS ENUM ('ACTIVE', 'RESIGNING', 'RESIGNED', 'DELETED');

-- CreateEnum
CREATE TYPE "base"."AnonymizationMode" AS ENUM ('MANUAL', 'AFTER_DAYS', 'IMMEDIATELY');

-- AlterTable: add new columns first (before dropping old ones)
ALTER TABLE "base"."cadet"
ADD COLUMN "deleted_at" TIMESTAMP(6),
ADD COLUMN "resigned_at" TIMESTAMP(6),
ADD COLUMN "status" "base"."CadetStatus" NOT NULL DEFAULT 'ACTIVE';

-- DataMigration: set status for soft-deleted cadets
UPDATE "base"."cadet"   
SET "status" = 'RESIGNED',
    "resigned_at" = "recdelete"
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
ADD COLUMN "resignationProcessEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: return process templates
CREATE TABLE "base"."resignation_process_template" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "fk_assosiation" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "defaultProcess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resignation_process_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable: return processes (final shape)
CREATE TABLE "base"."resignation_process" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "cadetId" CHAR(36) NOT NULL,
    "templateId" CHAR(36) NOT NULL,
    "fk_assosiation" CHAR(36) NOT NULL,
    "inspectorComment" TEXT,
    "finished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resignation_process_pkey" PRIMARY KEY ("id")
);

-- CreateTable: checklist templates
CREATE TABLE "base"."resignation_checklist_template" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "fk_assosiation" CHAR(36) NOT NULL,
    "processTemplateId" CHAR(36) NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "resignation_checklist_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable: checklist item statuses (final shape)
CREATE TABLE "base"."resignation_checklist_item" (
    "processId" CHAR(36) NOT NULL,
    "checklistTemplateId" CHAR(36) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedByUser" VARCHAR(10),

    CONSTRAINT "resignation_checklist_item_pkey" PRIMARY KEY ("processId","checklistTemplateId")
);

-- CreateIndex
CREATE INDEX "resignation_process_template_fk_assosiation_idx" ON "base"."resignation_process_template"("fk_assosiation");

-- CreateIndex
CREATE INDEX "resignation_checklist_template_processTemplateId_idx" ON "base"."resignation_checklist_template"("processTemplateId");

-- CreateIndex
CREATE INDEX "resignation_checklist_template_fk_assosiation_idx" ON "base"."resignation_checklist_template"("fk_assosiation");

-- CreateIndex
CREATE INDEX "resignation_process_fk_assosiation_idx" ON "base"."resignation_process"("fk_assosiation");

-- CreateIndex
CREATE INDEX "resignation_process_cadetId_idx" ON "base"."resignation_process"("cadetId");

-- CreateIndex
CREATE INDEX "resignation_checklist_item_checklistTemplateId_idx" ON "base"."resignation_checklist_item"("checklistTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "resignation_process_cadetId_key" ON "base"."resignation_process"("cadetId");

-- AddForeignKey
ALTER TABLE "base"."resignation_process_template" ADD CONSTRAINT "resignation_process_template_fk_assosiation_fkey" FOREIGN KEY ("fk_assosiation") REFERENCES "authentication"."assosiation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base"."resignation_process" ADD CONSTRAINT "resignation_process_cadetId_fkey" FOREIGN KEY ("cadetId") REFERENCES "base"."cadet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base"."resignation_process" ADD CONSTRAINT "resignation_process_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "base"."resignation_process_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base"."resignation_process" ADD CONSTRAINT "resignation_process_fk_assosiation_fkey" FOREIGN KEY ("fk_assosiation") REFERENCES "authentication"."assosiation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base"."resignation_checklist_template" ADD CONSTRAINT "resignation_checklist_template_processTemplateId_fkey" FOREIGN KEY ("processTemplateId") REFERENCES "base"."resignation_process_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base"."resignation_checklist_item" ADD CONSTRAINT "resignation_checklist_item_processId_fkey" FOREIGN KEY ("processId") REFERENCES "base"."resignation_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base"."resignation_checklist_item" ADD CONSTRAINT "resignation_checklist_item_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "base"."resignation_checklist_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
