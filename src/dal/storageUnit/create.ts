import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { storageUnitFormSchema } from "@/zod/storage";
import { z } from "zod";
import { __unsecuredGetUnitsWithUniformItems, StorageUnitWithUniformItems } from "./get";

type returnType = Promise<{
    error: {
        message: string,
        formElement: string,
    }
} | StorageUnitWithUniformItems[]>

const propSchema = storageUnitFormSchema;
type PropType = z.infer<typeof propSchema>;

export const create = (props: PropType): returnType => genericSAValidator(
    AuthRole.inspector,
    props,
    propSchema,
    {  }
).then(([{ assosiation }, data]) => prisma.$transaction(async (client) => {
    const nameDuplicate = await client.storageUnit.findFirst({
        where: {
            assosiationId: assosiation,
            name: data.name,
        }
    });
    if (nameDuplicate) {
        return {
            error: {
                message: "custom.nameDuplication.storageUnit",
                formElement: "name",
            }
        }
    }

    await client.storageUnit.create({
        data: {
            assosiationId: assosiation,
            ...data,
        }
    });
    return __unsecuredGetUnitsWithUniformItems(assosiation, client);
}));
