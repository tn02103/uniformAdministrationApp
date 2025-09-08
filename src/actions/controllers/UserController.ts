"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { nameValidationPattern, passwordValidationPattern, userNameValidationPattern, uuidValidationPattern } from "@/lib/validations";
import { User } from "@/types/userTypes";
import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';
import { revalidatePath } from "next/cache";
import { UserDBHandler } from "../dbHandlers/UserDBHandler";
import { genericSAValidatorV2 } from "../validations";

const dbHandler = new UserDBHandler();

export const getUserList = async () => genericSAValidatorV2(
    AuthRole.admin,
    true, {}
).then(({ organisationId }) => dbHandler.getUsersList(organisationId));

export const createUser = async (data: { username: string, name: string, role: AuthRole, active: boolean }, password: string) => genericSAValidatorV2(
    AuthRole.admin,
    (userNameValidationPattern.test(data.username)
        && nameValidationPattern.test(data.name)
        && (typeof data.active === "boolean")
        && (data.role in AuthRole && typeof data.role === 'number')),
    {}
).then(async ({ organisationId }) => {
    await prisma.$transaction(async (client) => {
        const userList = await dbHandler.getUsersList(organisationId, client as PrismaClient);

        if (userList.find(u => u.email === data.username)) {
            throw new Error("Could not save data Email allready in use");
        }

        await dbHandler.create(
            data,
            organisationId,
            await bcrypt.hash(password, 12),
            client as PrismaClient
        );
    });
    revalidatePath(`/[locale]/${organisationId}/admin/users`, 'page');
});

export const updateUser = async (data: User) => genericSAValidatorV2(
    AuthRole.admin,
    (uuidValidationPattern.test(data.id)
        && userNameValidationPattern.test(data.username)
        && nameValidationPattern.test(data.name)
        && (typeof data.active === "boolean")
        && (data.role in AuthRole && typeof data.role === 'number')),
    { userId: data.id }
).then(async ({ organisationId }) => {
    await dbHandler.update(data.id, data.name, data.role, data.active, prisma)
    revalidatePath(`/[locale]/${organisationId}/admin/users`, 'page');
});

export const changeUserPassword = async (userId: string, password: string) => genericSAValidatorV2(
    AuthRole.admin,
    uuidValidationPattern.test(userId) && passwordValidationPattern.test(password),
    { userId }
).then(async () => prisma.$transaction([
    dbHandler.setPassword(userId, await bcrypt.hash(password, 12), prisma),
    dbHandler.removeRefreshToken(userId, prisma),
]));

export const deleteUser = async (userId: string) => genericSAValidatorV2(
    AuthRole.admin,
    uuidValidationPattern.test(userId),
    { userId }
).then(async ({ organisationId }) => {
    await dbHandler.delete(userId, prisma);
    revalidatePath(`/[locale]/${organisationId}/admin/users`, 'page');
});
