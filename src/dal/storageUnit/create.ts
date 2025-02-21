import { genericSAValidator } from "@/actions/validations";
import SaveDataException from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {storageUnitFormSchema} from "@/zod/storage";
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
    AuthRole.materialManager,
    props,
    propSchema,
    {  }
).then(([{ assosiation }, data]) => prisma.$transaction(async (client) => {
    const unitList = await client.storageUnit.findMany({
        where: {
            assosiationId: assosiation,
        }
    });
    if (unitList.find(u => u.name === data.name)) {
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
