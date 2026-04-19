"use server";

import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { CadetInspectionHistoryRow } from "@/types/inspectionTypes";
import { getInspectionsByCadetSchema } from "@/zod/inspection";

export const getInspectionsByCadet = async (data: { cadetId: string }): Promise<CadetInspectionHistoryRow[]> =>
    genericSAValidator(
        AuthRole.materialManager,
        data,
        getInspectionsByCadetSchema,
        { cadetId: data.cadetId },
    ).then(async ([{ assosiation }, { cadetId }]) => {
        const rows = await prisma.$queryRaw<{
            id: string;
            date: string;
            attendanceState: 'inspected' | 'excused' | 'missing';
            uniformComplete: boolean | null;
            unresolvedCount: bigint;
            resolvedCount: bigint;
            newlyCreatedCount: bigint;
        }[]>`
            SELECT i.id,
                   i.date,
                   CASE
                       WHEN ci.id IS NOT NULL THEN 'inspected'
                       WHEN dr.fk_inspection IS NOT NULL THEN 'excused'
                       ELSE 'missing'
                   END AS "attendanceState",
                   ci.uniform_complete AS "uniformComplete",
                   COALESCE((SELECT COUNT(*) FROM inspection.v_deficiency_by_cadet v
                              WHERE v."fk_cadet" = ${cadetId}
                                AND v."fk_inspectionCreated" = i.id), 0) AS "newlyCreatedCount",
                   COALESCE((SELECT COUNT(*) FROM inspection.v_deficiency_by_cadet v
                              WHERE v."fk_cadet" = ${cadetId}
                                AND v."fk_inspectionResolved" = i.id), 0) AS "resolvedCount",
                   COALESCE((SELECT COUNT(*) FROM inspection.v_deficiency_by_cadet v
                              WHERE v."fk_cadet" = ${cadetId}
                                AND v."dateCreated" <= i.date::date
                                AND (v."dateResolved" IS NULL OR v."dateResolved" > i.date::date)), 0) AS "unresolvedCount"
              FROM inspection.inspection i
              JOIN base.cadet c ON c.id = ${cadetId} AND c.fk_assosiation = i.fk_assosiation AND c.recdelete IS NULL
             LEFT JOIN inspection.cadet_inspection ci ON ci.fk_inspection = i.id AND ci.fk_cadet = ${cadetId}
             LEFT JOIN inspection.deregistration dr ON dr.fk_inspection = i.id AND dr.fk_cadet = ${cadetId}
             WHERE i.fk_assosiation = ${assosiation}
               AND i.time_end IS NOT NULL
               AND i.date::date >= c.date_created
             ORDER BY i.date DESC
        `;

        return rows.map((row): CadetInspectionHistoryRow => ({
            id: row.id,
            date: row.date,
            attendanceState: row.attendanceState,
            uniformComplete: row.uniformComplete,
            unresolvedCount: Number(row.unresolvedCount),
            resolvedCount: Number(row.resolvedCount),
            newlyCreatedCount: Number(row.newlyCreatedCount),
        }));
    });
