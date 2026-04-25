"use server";

import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { InspectionReview } from "@/types/deficiencyTypes";
import { getClosedInspectionReportSchema } from "@/zod/inspection";
import { DBQuery } from "../_dbQuerys";

const dbHandler = new DBQuery();

export const getClosedInspectionReport = async (data: { inspectionId: string }): Promise<InspectionReview> =>
    genericSAValidator(
        AuthRole.materialManager,
        data,
        getClosedInspectionReportSchema,
        { inspectionId: data.inspectionId },
    ).then(([user, { inspectionId }]) =>
        prisma.$transaction((tx) => dbHandler.getInspectionReviewData(user.assosiation, inspectionId, tx))
    );
