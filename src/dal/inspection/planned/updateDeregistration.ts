"use server";

import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateCadetRegistrationPropShema = z.object({
    cadetId: z.string().uuid(),
    inspectionId: z.string().uuid(),
    deregister: z.boolean(),
});
type updateCadetRegistrationPropShema = z.infer<typeof updateCadetRegistrationPropShema>;

export const updateCadetRegistrationForInspection = async (props: updateCadetRegistrationPropShema) => genericSAValidator(
    AuthRole.materialManager,
    props,
    updateCadetRegistrationPropShema,
    { cadetId: props.cadetId, inspectionId: props.inspectionId }
).then(([, data]) => prisma.$transaction(async (client) => {

    const deregistration = await client.deregistration.findUnique({
        where: {
            fk_cadet_fk_inspection: {
                fk_cadet: data.cadetId,
                fk_inspection: data.inspectionId
            }
        }
    });

    if (data.deregister) {
        if (deregistration) return true;

        return client.deregistration.create({
            data: {
                fk_cadet: data.cadetId,
                fk_inspection: data.inspectionId,
            }
        });
    } else {
        if (!deregistration) return true;

        return client.deregistration.delete({
            where: {
                fk_cadet_fk_inspection: {
                    fk_cadet: data.cadetId,
                    fk_inspection: data.inspectionId,
                }
            }
        });
    }
}));
