"use server";
import { AuthRole } from "@/lib/AuthRoles";
import { UniformDBHandler } from "../dbHandlers/UniformDBHandler";
import { genericSAValidatiorV2 } from "../validations";
import { uuidValidationPattern } from "@/lib/validations";



const dbHandler = new UniformDBHandler();

export const getUniformCountByType = (uniformTypeId: string) => genericSAValidatiorV2(
    AuthRole.materialManager,
    (uuidValidationPattern.test(uniformTypeId)),
    { uniformTypeId }
).then(() => dbHandler.getUniformCountByType(uniformTypeId));

