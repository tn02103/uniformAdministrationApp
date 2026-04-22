-- Migration: Add FK fields to deficiency table and copy data from sub-tables

-- AlterTable: add nullable FK columns
ALTER TABLE "inspection"."deficiency" ADD COLUMN "fk_cadet" CHAR(36),
ADD COLUMN "fk_material" CHAR(36),
ADD COLUMN "fk_uniform" CHAR(36);

-- Data migration: copy FK values from cadet_deficiency
UPDATE "inspection"."deficiency" d
SET fk_cadet    = cd.fk_cadet,
    fk_uniform  = cd.fk_uniform,
    fk_material = cd.fk_material
FROM "inspection"."cadet_deficiency" cd
WHERE cd.deficiency_id = d.id;

-- Data migration: copy FK values from uniform_deficiency
UPDATE "inspection"."deficiency" d
SET fk_uniform = ud.fk_uniform
FROM "inspection"."uniform_deficiency" ud
WHERE ud.deficiency_id = d.id;

-- Migration: Drop cadet_deficiency and uniform_deficiency sub-tables,
-- add FK constraints on deficiency, and simplify v_deficiency_by_cadet view

-- Drop dependent views first (v_cadet_generaloverview depends on v_deficiency_by_cadet)
DROP VIEW IF EXISTS base.v_cadet_generaloverview;
DROP VIEW IF EXISTS inspection.v_deficiency_by_cadet;

-- DropForeignKey
ALTER TABLE "inspection"."cadet_deficiency" DROP CONSTRAINT "cadet_deficiency_deficiency_id_fkey";

-- DropForeignKey
ALTER TABLE "inspection"."cadet_deficiency" DROP CONSTRAINT "cadet_deficiency_fk_cadet_fkey";

-- DropForeignKey
ALTER TABLE "inspection"."cadet_deficiency" DROP CONSTRAINT "cadet_deficiency_fk_material_fkey";

-- DropForeignKey
ALTER TABLE "inspection"."cadet_deficiency" DROP CONSTRAINT "cadet_deficiency_fk_uniform_fkey";

-- DropForeignKey
ALTER TABLE "inspection"."uniform_deficiency" DROP CONSTRAINT "uniform_deficiency_deficiency_id_fkey";

-- DropForeignKey
ALTER TABLE "inspection"."uniform_deficiency" DROP CONSTRAINT "uniform_deficiency_fk_uniform_fkey";

-- DropTable
DROP TABLE "inspection"."cadet_deficiency";

-- DropTable
DROP TABLE "inspection"."uniform_deficiency";

-- AddForeignKey
ALTER TABLE "inspection"."deficiency" ADD CONSTRAINT "deficiency_fk_cadet_fkey" FOREIGN KEY ("fk_cadet") REFERENCES "base"."cadet"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "inspection"."deficiency" ADD CONSTRAINT "deficiency_fk_uniform_fkey" FOREIGN KEY ("fk_uniform") REFERENCES "base"."uniform"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "inspection"."deficiency" ADD CONSTRAINT "deficiency_fk_material_fkey" FOREIGN KEY ("fk_material") REFERENCES "base"."material"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Recreate v_deficiency_by_cadet: use COALESCE to derive fk_cadet from uniform_issued for uniform-dependent deficiencies
CREATE OR REPLACE VIEW inspection.v_deficiency_by_cadet AS
SELECT d.id,
    dt.id AS "typeId",
    dt.name AS "typeName",
    d.fk_deficiency_type AS "fk_deficiencyType",
    d.description,
    d.comment,
    d.date_created AS "dateCreated",
    d.date_updated AS "dateUpdated",
    d.date_resolved AS "dateResolved",
    d.user_created AS "userCreated",
    d.user_updated AS "userUpdated",
    d.user_resolved AS "userResolved",
    d.fk_inspection_created AS "fk_inspectionCreated",
    d.fk_inspection_resolved AS "fk_inspectionResolved",
    COALESCE(d.fk_cadet, ui.fk_cadet) AS fk_cadet,
    d.fk_uniform,
    d.fk_material
FROM inspection.deficiency d
    JOIN inspection.deficiency_type dt ON dt.id = d.fk_deficiency_type
    LEFT JOIN base.uniform_issued ui ON ui.fk_uniform = d.fk_uniform
        AND ui.date_returned IS NULL
        AND d.fk_cadet IS NULL;
ALTER TABLE inspection.v_deficiency_by_cadet OWNER TO CURRENT_USER;

-- Recreate v_cadet_generaloverview (unchanged logic, depends on v_deficiency_by_cadet)
CREATE OR REPLACE VIEW base.v_cadet_generaloverview AS
SELECT c.id,
    c.fk_assosiation,
    c.firstname,
    c.lastname,
    ci.fk_inspection,
    ci.uniform_complete AS "uniformComplete",
    i.date AS "lastInspection",
    count(vdbc.id) AS "activeDeficiencyCount"
FROM base.cadet c
    LEFT JOIN inspection.cadet_inspection ci ON c.id = ci.fk_cadet
    AND ci.fk_inspection = (
        (
            SELECT ii.id
            FROM inspection.inspection ii
                JOIN inspection.cadet_inspection ici ON ii.id = ici.fk_inspection
            WHERE ici.fk_cadet = c.id
            ORDER BY ii.date DESC
            LIMIT 1
        )
    )
    LEFT JOIN inspection.inspection i ON i.id = ci.fk_inspection
    LEFT JOIN inspection.v_deficiency_by_cadet vdbc ON vdbc.fk_cadet = c.id
    AND vdbc."dateResolved" IS NULL
WHERE c.recdelete IS NULL
GROUP BY c.id,
    ci.fk_inspection,
    ci.uniform_complete,
    i.date;
ALTER TABLE base.v_cadet_generaloverview OWNER TO CURRENT_USER;

-- Migration: add_cadet_date_created
-- Add date_created column to base.cadet; backfill from issuance history,
-- fallback to CURRENT_DATE for cadets with no issuance history.

ALTER TABLE base.cadet ADD COLUMN IF NOT EXISTS date_created date;

-- Back-fill date_created: use earliest issuance date, or today if none
UPDATE base.cadet c
   SET date_created = COALESCE(
       (
           SELECT MIN(d)::date
             FROM (
                 SELECT MIN(ui.date_issued) AS d FROM base.uniform_issued ui WHERE ui.fk_cadet = c.id
                 UNION ALL
                 SELECT MIN(mi.date_issued) AS d FROM base.material_issued mi WHERE mi.fk_cadet = c.id
             ) sub
            WHERE d IS NOT NULL
       ),
       CURRENT_DATE
   );

-- Enforce NOT NULL now that every row has a value
ALTER TABLE base.cadet ALTER COLUMN date_created SET NOT NULL;

-- Set default for future inserts
ALTER TABLE base.cadet ALTER COLUMN date_created SET DEFAULT now();
