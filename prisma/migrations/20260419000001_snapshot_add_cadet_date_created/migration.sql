-- Migration: snapshot_add_cadet_date_created
-- Add nullable date_created column to base.cadet and back-fill from issuance history

ALTER TABLE base.cadet ADD COLUMN IF NOT EXISTS date_created date;

-- Back-fill date_created from earliest uniform or material issuance date per cadet
UPDATE base.cadet c
   SET date_created = (
       SELECT MIN(d)::date
         FROM (
             SELECT MIN(ui.date_issued) AS d FROM base.uniform_issued ui WHERE ui.fk_cadet = c.id
             UNION ALL
             SELECT MIN(mi.date_issued) AS d FROM base.material_issued mi WHERE mi.fk_cadet = c.id
         ) sub
        WHERE d IS NOT NULL
   );

-- Set default for future rows only after backfill
ALTER TABLE base.cadet ALTER COLUMN date_created SET DEFAULT now();
