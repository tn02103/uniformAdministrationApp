"use server";

import { genericSAValidator } from "@/actions/validations";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { sendInspectionReviewMail } from "@/lib/email/inspectionReview";
import dayjs from "dayjs";
import { z } from "zod";
import { DBQuery } from "./_dbQuerys";

const dbHandler = new DBQuery();
const stopInspectionPropShema = z.object({
    time: z.string(),
    id: z.string().uuid(),
});
type stopInspectionPropShema = z.infer<typeof stopInspectionPropShema>;
export const stopInspection = (props: stopInspectionPropShema) => genericSAValidator(
    AuthRole.materialManager,
    props,
    stopInspectionPropShema,
    { inspectionId: props.id }
).then(async ([data, user]) => prisma.$transaction(async (client) => {
    const inspection = await client.inspection.findUniqueOrThrow({
        where: { id: data.id },
    });
    if (!inspection.timeStart) {
        throw new SaveDataException('Could not finish inspection: Inspection has not jet been started')
    }
    if (inspection.timeEnd) {
        throw new SaveDataException('Could not finish inspection: Inspection already finished');
    }
    const starttime = dayjs(dayjs(inspection.timeStart).format('HH:mm:ss'), "HH:mm:ss");// remove Date-information from time
    if (dayjs(data.time, "HH:mm:ss").isBefore(starttime, "second")) {
        throw new SaveDataException('Could not finish inspection: Endtime is before starttime of inspection');
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
