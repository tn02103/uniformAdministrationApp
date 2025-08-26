import { genericSAValidator } from "@/actions/validations";
import { __unsecuredGetCadetUniformMap } from "@/dal/cadet/uniformMap";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/db";
import { CadetUniformMap } from "@/types/globalCadetTypes";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const propSchema = z.object({
    uniformId: z.string().uuid(),
    cadetId: z.string().uuid(),
});
type PropType = z.infer<typeof propSchema>;

export const returnItem = async (props: PropType): Promise<CadetUniformMap> => genericSAValidator(
    AuthRole.inspector,
    props,
    propSchema,
    { cadetId: props.cadetId, uniformId: props.uniformId }
).then(([, { cadetId, uniformId }]) => prisma.$transaction(async (client) => {
    const issuedEntry = await client.uniformIssued.findFirst({
        where: {
            uniform: {
                id: uniformId,
                recdelete: null,
            },
            cadet:  {
                id: cadetId,
                recdelete: null,
            },
            dateReturned: null,
        }
    });
    if (!issuedEntry) throw new SaveDataException('Could not return Uniform. Issued Entry not found: ' + uniformId);

    await __unsecuredReturnUniformitem(issuedEntry.id, issuedEntry.dateIssued, client);
    return __unsecuredGetCadetUniformMap(cadetId, client);
}));

export const __unsecuredReturnUniformitem = (issuedEntryId: string, dateIssued: Date, client: Prisma.TransactionClient) => {
    if (dayjs().isSame(dateIssued, "day")) {
        return client.uniformIssued.delete({
            where: { id: issuedEntryId }
        });
    } else {
        return client.uniformIssued.update({
            where: { id: issuedEntryId },
            data: {
                dateReturned: new Date(),
            },
        });
    }
}
