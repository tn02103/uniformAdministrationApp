import { genericSAValidator } from "@/actions/validations";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { InspectionReview } from "@/types/deficiencyTypes";
import { getClosedInspectionReportSchema } from "@/zod/inspection";

export const getClosedInspectionReport = (data: { inspectionId: string }): Promise<InspectionReview> =>
    genericSAValidator(
        AuthRole.materialManager,
        data,
        getClosedInspectionReportSchema,
        { inspectionId: data.inspectionId },
    ).then(async ([user, { inspectionId }]) => {
        const inspection = await prisma.inspection.findUnique({
            where: { id: inspectionId, fk_assosiation: user.assosiation },
            select: { closingReport: true },
        });

        if (!inspection?.closingReport) {
            throw new SaveDataException('No closing report found for this inspection');
        }

        return inspection.closingReport as unknown as InspectionReview;
    });
