/**
 * @internal
 * Internal DAL helper used only by the XLSX API route handler.
 * Multi-tenancy is enforced via the `where` clause (both `id` and `fk_assosiation`).
 * The caller (API route) is responsible for session authentication before invoking this.
 * NOT exported from the barrel to prevent exposure as a Next.js Server Action.
 */
import { prisma } from "@/lib/db";
import { InspectionReview } from "@/types/deficiencyTypes";

export type InspectionReportDownload = {
    name: string;
    date: string;
    closingReport: InspectionReview;
};

export const getReportForDownload = async (
    inspectionId: string,
    associationId: string
): Promise<InspectionReportDownload | null> => {
    const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId, fk_assosiation: associationId },
        select: {
            name: true,
            date: true,
            closingReport: true,
        },
    });

    if (!inspection?.closingReport) {
        return null;
    }

    return {
        name: inspection.name,
        date: inspection.date,
        closingReport: inspection.closingReport as unknown as InspectionReview,
    };
};
