"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { nameValidationPattern, passwordValidationPattern, userNameValidationPattern, uuidValidationPattern } from "@/lib/validations";
import { User } from "@/types/userTypes";
import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';
import { revalidatePath } from "next/cache";
import { UserDBHandler } from "../dbHandlers/UserDBHandler";
import { genericSAValidatiorV2 } from "../validations";

const dbHandler = new UserDBHandler();

export const getUserList = () => genericSAValidatiorV2(
    AuthRole.admin,
    true, {}
).then(({ assosiation }) => dbHandler.getUsersList(assosiation));

export const createUser = (data: { username: string, name: string, role: AuthRole, active: boolean }, password: string) => genericSAValidatiorV2(
    AuthRole.admin,
    (userNameValidationPattern.test(data.username)
        && nameValidationPattern.test(data.name)
        && (typeof data.active === "boolean")
        && (data.role in AuthRole && typeof data.role === 'number')),
    {}
).then(async ({ assosiation }) => {
    await prisma.$transaction(async (client) => {
        const userList = await dbHandler.getUsersList(assosiation, client as PrismaClient);

        if (userList.find(u => u.username === data.username)) {
            throw new Error("Could not save data Username allready in use");
        }

        await dbHandler.create(
            data,
            assosiation,
            await bcrypt.hash(password, 12),
            client as PrismaClient
        );
    });
    revalidatePath(`/[locale]/${assosiation}/admin/users`, 'page');
});

export const updateUser = (data: User) => genericSAValidatiorV2(
    AuthRole.admin,
    (uuidValidationPattern.test(data.id)
        && userNameValidationPattern.test(data.username)
        && nameValidationPattern.test(data.name)
        && (typeof data.active === "boolean")
        && (data.role in AuthRole && typeof data.role === 'number')),
    { userId: data.id }
).then(async ({ assosiation }) => {
    await dbHandler.update(data.id, data.name, data.role, data.active, prisma)
    revalidatePath(`/[locale]/${assosiation}/admin/users`, 'page');
});

export const changeUserPassword = (userId: string, password: string) => genericSAValidatiorV2(
    AuthRole.admin,
    uuidValidationPattern.test(userId) && passwordValidationPattern.test(password),
    { userId }
).then(async () => prisma.$transaction([
    dbHandler.setPassword(userId, await bcrypt.hash(password, 12), prisma),
    dbHandler.removeRefreshToken(userId, prisma),
]));

export const deleteUser = (userId: string) => genericSAValidatiorV2(
    AuthRole.admin,
    uuidValidationPattern.test(userId),
    { userId }
).then(async ({ assosiation }) => {
    await dbHandler.delete(userId, prisma);
    revalidatePath(`/[locale]/${assosiation}/admin/users`, 'page');
});
