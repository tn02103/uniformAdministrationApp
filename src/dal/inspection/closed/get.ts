"use server";

import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { ClosedInspectionSummary } from "@/types/deficiencyTypes";

export const getClosedInspectionList = async (): Promise<ClosedInspectionSummary[]> =>
    genericSANoDataValidator(AuthRole.materialManager)
        .then(async ([user]) => {
            const rows = await prisma.$queryRaw<{
                id: string;
                name: string;
                date: string;
                time_start: string;
                time_end: string;
                cadetsInspected: bigint;
                deregisteredCadets: bigint;
                activeCadets: bigint;
                uniformCompleteCount: bigint;
            }[]>`
                SELECT i.id,
                       i.name,
                       i.date,
                       i.time_start,
                       i.time_end,
                       (SELECT COUNT(ic.id)
                          FROM inspection.cadet_inspection ic
                         WHERE ic.fk_inspection = i.id) AS "cadetsInspected",
                       (SELECT COUNT(dr.fk_inspection)
                          FROM inspection.deregistration dr
                         WHERE dr.fk_inspection = i.id) AS "deregisteredCadets",
                       (SELECT COUNT(c.id)
                          FROM base.cadet c
                         WHERE c.fk_assosiation = i.fk_assosiation
                           AND c.recdelete IS NULL) AS "activeCadets",
                       (SELECT COUNT(ic2.id)
                          FROM inspection.cadet_inspection ic2
                         WHERE ic2.fk_inspection = i.id
                           AND ic2.uniform_complete = TRUE) AS "uniformCompleteCount"
                  FROM inspection.inspection i
                 WHERE i.fk_assosiation = ${user.assosiation}
                   AND i.time_end IS NOT NULL
              ORDER BY i.date DESC
            `;

            return rows.map((row): ClosedInspectionSummary => {
                const cadetsInspected = Number(row.cadetsInspected);
                const deregisteredCadets = Number(row.deregisteredCadets);
                const activeCadets = Number(row.activeCadets);
                const uniformCompleteCount = Number(row.uniformCompleteCount);
                const missingCadets = activeCadets - cadetsInspected - deregisteredCadets;
                const uniformCompletePercent = cadetsInspected > 0
                    ? Math.round(uniformCompleteCount / cadetsInspected * 1000) / 10
                    : NaN;

                return {
                    id: row.id,
                    name: row.name,
                    date: row.date,
                    timeStart: row.time_start,
                    timeEnd: row.time_end,
                    activeCadets,
                    cadetsInspected,
                    deregisteredCadets,
                    missingCadets,
                    uniformCompletePercent,
                };
            });
        });
