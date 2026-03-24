import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { DeleteUserSchema } from "@/zod/user";

export const deleteUser = (data: { userId: string }) =>
    genericSAValidator(AuthRole.admin, data, DeleteUserSchema, { userId: data.userId })
        .then(() => {
            throw new Error("deleteUser is not yet implemented (TODO-010)");
        });
