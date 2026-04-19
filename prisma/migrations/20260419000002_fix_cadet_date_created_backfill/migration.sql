-- Migration: fix_cadet_date_created_backfill
-- Reset and backfill `date_created` for cadets where previous migration set default too early

-- Reset date_created to NULL for all cadets (so backfill can work correctly)
UPDATE base.cadet SET date_created = NULL;

-- Backfill from earliest uniform/material issuance date
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
