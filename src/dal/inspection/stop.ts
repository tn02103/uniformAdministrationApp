"use server";

import { genericSAValidator } from "@/actions/validations";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { sendInspectionReviewMail } from "@/lib/email/inspectionReview";
import { z } from "zod";
import { DBQuery } from "./_dbQuerys";
import dayjs from "@/lib/dayjs";

const dbHandler = new DBQuery();
const stopInspectionPropShema = z.object({
    time: z.string(),
    id: z.string().uuid(),
});
type stopInspectionPropShema = z.infer<typeof stopInspectionPropShema>;
export const stopInspection = async (props: stopInspectionPropShema) => genericSAValidator(
    AuthRole.materialManager,
    props,
    stopInspectionPropShema,
    { inspectionId: props.id }
).then(async ([user, data]) => prisma.$transaction(async (client) => {
    const inspection = await client.inspection.findUniqueOrThrow({
        where: { id: data.id },
    });
    if (!inspection.timeStart) {
        throw new SaveDataException('Could not finish inspection: Inspection has not jet been started')
    }
    if (inspection.timeEnd) {
        throw new SaveDataException('Could not finish inspection: Inspection already finished');
    }

    const startTime = dayjs(inspection.timeStart, "HH:mm");
    const endTime = dayjs(data.time, "HH:mm");
    const endTimeParts = data.time.split(':');
    if (endTimeParts.length !== 2 
        || isNaN(Number(endTimeParts[0])) || Number(endTimeParts[0]) < 0 || Number(endTimeParts[0]) > 23
        || isNaN(Number(endTimeParts[1])) || Number(endTimeParts[1]) < 0 || Number(endTimeParts[1]) > 59) {
        throw new SaveDataException('Could not finish inspection: Endtime is not a valid time');
    }
    if (!startTime.isBefore(endTime)) {
        throw new SaveDataException('Could not finish inspection: Endtime is before starttime of inspection');
    }

    // update Inspection
    await prisma.inspection.update({
        where: { id: data.id },
        data: { timeEnd: data.time }
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
