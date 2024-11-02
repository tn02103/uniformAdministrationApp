"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { sendInspectionReviewMail } from "@/lib/email/inspectionReview";
import { DeficiencyType, deficiencyTypeArgs, InspectionStatus } from "@/types/deficiencyTypes";
import dayjs from "@/lib/dayjs";
import { revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";
import { InspectionDBHandler } from "../dbHandlers/InspectionDBHandler";
import { genericSAValidatiorV2, genericSAValidator } from "../validations";
const dbHandler = new InspectionDBHandler();

export const getDeficiencyTypeList = (): Promise<DeficiencyType[]> => genericSAValidatiorV2(AuthRole.inspector, true, {})
    .then(({ assosiation }) => prisma.deficiencyType.findMany({
        where: {
            fk_assosiation: assosiation,
            disabledDate: null,
        },
        ...deficiencyTypeArgs,
        orderBy: {
            "name": "asc"
        },
    }));

export const getInspectedCadetIdList = () => genericSAValidatiorV2(AuthRole.inspector, true, {})
    .then(async ({ assosiation }) =>
        prisma.cadetInspection.findMany({
            select: {
                fk_cadet: true
            },
            where: {
                inspection: {
                    fk_assosiation: assosiation,
                    date: new Date(),
                    timeEnd: null,
                    timeStart: { not: null },
                },
            },
        }).then((data) => data.map(c => c.fk_cadet))
    );


export const startInspection = () => genericSAValidatiorV2(
    AuthRole.materialManager,
    true,
    {}
).then(async ({ assosiation }) => prisma.$transaction(async (client) => {
    const i = await client.inspection.findFirst({
        where: {
            date: new Date(),
        },
    });

    if (!i) {
        throw new Error('Could not start inspection. No Planned Insepctions Today');
    }
    if (i.timeStart) {
        throw new Error('Inspection already started.');
    }

    await client.inspection.update({
        where: { id: i.id },
        data: {
            timeStart: new Date(),
        },
    });

    revalidateTag(`serverA.inspectionState.${assosiation}`);
}));

const closeInspectionPropShema = z.object({
    time: z.string(),
    id: z.string().uuid(),
})
type CloseInspectionPropShema = z.infer<typeof closeInspectionPropShema>;
export const closeInspection = (props: CloseInspectionPropShema) => genericSAValidator(
    AuthRole.materialManager,
    props,
    closeInspectionPropShema,
    { inspectionId: props.id }
).then(async ([data, user]) => prisma.$transaction(async (client) => {
    // allready closed
    const inspection = await prisma.inspection.findUniqueOrThrow({
        where: { id: data.id },
    });
    if (inspection.timeEnd) {
        throw new Error('Inspection allready closed');
    }
    // update Inspection
    await prisma.inspection.update({
        where: { id: data.id },
        data: { timeEnd: dayjs.utc(data.time, 'HH:mm').toDate() }
    });
    // send Mails
    const config = await prisma.assosiationConfiguration.findUnique({
        where: { assosiationId: user.assosiation }
    });

    if (!config || !config.inspectionReportEmails) {
        return;
    }
    const inspreview = await dbHandler.getInspectionReviewData(user.assosiation, data.id, client);

    await sendInspectionReviewMail(config.inspectionReportEmails, inspreview);
}));
