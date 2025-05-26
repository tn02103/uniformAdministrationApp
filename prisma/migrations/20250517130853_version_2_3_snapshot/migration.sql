 
DROP VIEW base.v_cadet_generaloverview;
 
ALTER TABLE "inspection"."inspection"
    ALTER COLUMN "time_start" TYPE CHAR(5) USING TO_CHAR("time_start", 'HH24:MI'),
    ALTER COLUMN "time_end" TYPE CHAR(5) USING TO_CHAR("time_end", 'HH24:MI'),
    ALTER COLUMN "date" TYPE CHAR(10) USING TO_CHAR("date", 'YYYY-MM-DD');
 
 -- View: base.v_cadet_generaloverview


CREATE OR REPLACE VIEW base.v_cadet_generaloverview
 AS
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
  WHERE c.recdelete IS NULL
  GROUP BY c.id, ci.fk_inspection, ci.uniform_complete, i.date;

ALTER TABLE base.v_cadet_generaloverview
    OWNER TO vk_server;
