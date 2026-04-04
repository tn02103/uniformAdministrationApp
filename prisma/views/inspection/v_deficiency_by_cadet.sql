SELECT
  d.id,
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
  cd.fk_cadet,
  cd.fk_uniform,
  cd.fk_material
FROM
  (
    (
      inspection.deficiency d
      JOIN inspection.deficiency_type dt ON ((dt.id = d.fk_deficiency_type))
    )
    JOIN inspection.cadet_deficiency cd ON ((d.id = cd.deficiency_id))
  )
UNION
ALL
SELECT
  d.id,
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
  ui.fk_cadet,
  ud.fk_uniform,
  NULL :: bpchar AS fk_material
FROM
  (
    (
      (
        (
          inspection.deficiency d
          JOIN inspection.deficiency_type dt ON ((dt.id = d.fk_deficiency_type))
        )
        JOIN inspection.uniform_deficiency ud ON ((d.id = ud.deficiency_id))
      )
      JOIN base.uniform u ON ((u.id = ud.fk_uniform))
    )
    LEFT JOIN base.uniform_issued ui ON (
      (
        (ui.fk_uniform = u.id)
        AND (ui.date_returned IS NULL)
      )
    )
  );