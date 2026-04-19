/**
 * @internal
 * Internal DAL helper used only by the XLSX API route handler.
 * Multi-tenancy is enforced by verifying the inspection belongs to the given association
 * before running the live query.
 * The caller (API route) is responsible for session authentication before invoking this.
 * NOT exported from the barrel to prevent exposure as a Next.js Server Action.
 */
import { prisma } from "@/lib/db";
import { InspectionReview } from "@/types/deficiencyTypes";
import { DBQuery } from "../_dbQuerys";

const dbHandler = new DBQuery();

export const getReportForDownload = async (
    inspectionId: string,
    associationId: string
): Promise<InspectionReview | null> => {
    const exists = await prisma.inspection.findFirst({
        where: { id: inspectionId, fk_assosiation: associationId, timeEnd: { not: null } },
        select: { id: true },
    });

    if (!exists) {
        return null;
    }

    return prisma.$transaction((tx) => dbHandler.getInspectionReviewData(associationId, inspectionId, tx));
};
