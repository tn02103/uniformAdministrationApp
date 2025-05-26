import { InspectionReview, InspectionReviewCadet, InspectionReviewDeficiency } from "@/types/deficiencyTypes";
import { Prisma } from "@prisma/client";

export class DBQuery {
  getInspectionReviewData = async (fk_assosiation: string, id: string, client: Prisma.TransactionClient) => {
    const insp = await this.getInspectionInformation(id, client).then(d => d[0]);
    const activeDeficiencieList = await this.getActiveDeficiencyList(id, client);
    const cadetList = await this.getInspectionReviewCadetList(fk_assosiation, id, insp.date, client);
    return {
      id: id,
      date: insp.date,
      name: insp.name,
      timeStart: insp.time_start,
      timeEnd: insp.time_end,
      deregisteredCadets: Number(insp.deregisteredCadets) ?? 0,
      activeCadets: Number(insp.activeCadets) ?? 0,
      cadetsInspected: Number(insp.cadetsInspected) ?? 0,
      newDeficiencies: Number(insp.newDeficiencies) ?? 0,
      activeDeficiencies: Number(insp.activeDeficiencies) ?? 0,
      resolvedDeficiencies: Number(insp.newlyResolvedDeficiencies) ?? 0,
      cadetList: cadetList,
      activeDeficiencyList: activeDeficiencieList,
    } satisfies InspectionReview
  }

  getInspectionInformation = (id: string, client: Prisma.TransactionClient) =>
    client.$queryRaw<{
      id: string,
      date: string,
      name: string,
      time_start: string,
      time_end: string,
      cadetsInspected: bigint,
      deregisteredCadets: bigint,
      activeCadets: bigint,
      newlyResolvedDeficiencies: bigint,
      newDeficiencies: bigint,
      activeDeficiencies: bigint
    }[]>`
             SELECT i.id,
                    i.name,
        	        i.date,
                    i.time_start,
                    i.time_end,
        	        (SELECT COUNT(ic.id)
                       FROM inspection.cadet_inspection ic
                      WHERE ic.fk_inspection = i.id) as "cadetsInspected",
                    (SELECT COUNT(dr.fk_inspection)
                       FROM inspection.deregistration dr
                      WHERE dr.fk_inspection = i.id) as "deregisteredCadets",
                    (SELECT COUNT(c.id)
                       FROM base.cadet c
                      WHERE c.fk_assosiation = i.fk_assosiation
                        AND c.recdelete IS NULL) as "activeCadets",
         	        (SELECT COUNT(cd.id)
                       FROM inspection.deficiency cd
                      WHERE cd.fk_inspection_resolved = i.id) as "newlyResolvedDeficiencies",
                    (SELECT COUNT(cd2.id)
                       FROM inspection.deficiency cd2
                      WHERE cd2.fk_inspection_created = i.id) as "newDeficiencies",
                    (SELECT COUNT(cd3.id)
                       FROM inspection.deficiency cd3
                       JOIN inspection.deficiency_type dt
                         ON cd3.fk_deficiency_type = dt.id
                      WHERE cd3.date_created <= i.date
                        AND dt.fk_assosiation = i.fk_assosiation
          	  	        AND	(cd3.date_resolved IS NULL 
                         OR cd3.date_resolved > i.date)) as "activeDeficiencies"
               FROM inspection.inspection i
           GROUP BY i.id
             HAVING i.id = ${id}`
    ;

  getActiveDeficiencyList = (id: string, client: Prisma.TransactionClient): Promise<InspectionReviewDeficiency[]> =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.$queryRaw<any[]>`
         SELECT v.*,
	            CASE
		            WHEN v."fk_inspectionCreated" = ${id}
		            THEN 1
		            ELSE 0
	            END as "new",
	            c.lastname,
	            c.firstname,
	            dt.dependent,
	            dt.relation
           FROM inspection.v_deficiency_by_cadet v
           JOIN inspection.deficiency_type dt ON v."fk_deficiencyType" = dt.id
      LEFT JOIN base.cadet c ON c.id = v.fk_cadet
        `.then((queryList) => queryList.map(d => ({
      id: d.id,
      comment: d.comment,
      description: d.description,
      dateCreated: d.dateCreated,
      new: d.new,
      deficiencyType: {
        id: d.fk_deficiencyType,
        name: d.typeName,
        dependent: d.dependent,
        relation: d.relation,
      },
      cadet: d.fk_cadet ? {
        id: d.fk_cadet,
        firstname: d.firstname,
        lastname: d.lastname,
      } : undefined
    })));

  getInspectionReviewCadetList = (fk_assosiation: string, inspectionId: string, date: string, client: Prisma.TransactionClient): Promise<InspectionReviewCadet[]> =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.$queryRaw<any[]>`
         SELECT c."id" as "cadetId",
                c."firstname",
                c."lastname",
	 		          lci."date" as "lastInspectionDate",
                lci."uniform_complete" as "uniformComplete",
                lci."id" as "lastInspectionId",
                counts."openDeficiencies",
                counts."overalClosedDeficiencies",
                counts."newlyClosedDeficiencies"
           FROM base.cadet c
      LEFT JOIN (SELECT i."date", i."id", ci.uniform_complete, ci.fk_cadet
                   FROM inspection.cadet_inspection ci
                   JOIN inspection.inspection i
                     ON ci.fk_inspection = i.id
                   JOIN (SELECT ci2.fk_cadet, MAX(i2.date) as "lastDate"
                           FROM inspection.cadet_inspection ci2
                           JOIN inspection.inspection i2
                             ON ci2.fk_inspection = i2.id
                          WHERE i2.date <= ${date}
                       GROUP BY ci2.fk_cadet) as li
                     ON ci.fk_cadet = li.fk_cadet
                    AND i.date = li."lastDate") as "lci"
             ON lci."fk_cadet" = c."id"
	  LEFT JOIN (SELECT "fk_cadet",
				    	SUM(
                CASE WHEN ("dateResolved" IS NULL OR "dateResolved" > ${date})
							  THEN 1 
							  ELSE 0 END
              ) as "openDeficiencies",
              SUM(
                CASE WHEN("dateResolved" IS NOT NULL AND "dateResolved" <= ${date})
							  THEN 1 
							  ELSE 0 END
              ) as "overalClosedDeficiencies",
              SUM(
                CASE WHEN ("fk_inspectionResolved" = ${inspectionId})
							  THEN 1 
							  ELSE 0 END
              ) as "newlyClosedDeficiencies"
			       FROM inspection.v_deficiency_by_cadet
				  WHERE "dateCreated" <= ${date}
			   GROUP BY "fk_cadet") as "counts"
	         ON counts.fk_cadet = c.id
          WHERE c.fk_assosiation= ${fk_assosiation}
            AND c.recdelete IS NULL
    `.then(list => list.map(d => ({
      cadet: {
        id: d.cadetId,
        firstname: d.firstname,
        lastname: d.lastname,
      },
      lastInspection: d.lastInspectionId ? {
        id: d.lastInspectionId,
        date: d.lastInspectionDate,
        uniformComplete: d.uniformComplete,
      } : undefined,
      activeDeficiencyCount: Number(d.openDeficiencies),
      newlyClosedDeficiencyCount: Number(d.newlyClosedDeficiencies),
      overalClosedDeficiencyCount: Number(d.overalClosedDeficiencies),
    })));
}
