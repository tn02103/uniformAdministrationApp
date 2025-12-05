import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { userArgs } from "@/types/userTypes";
import { PrismaClient } from "@/prisma/client";

export class UserDBHandler {

    getUsersList = (fk_assosiation: string, client?: PrismaClient) =>
        (client ?? prisma).user.findMany({
            where: { fk_assosiation },
            ...userArgs,
        });

    create = (data: { username: string, name: string, role: AuthRole, active: boolean }, fk_assosiation: string, password: string, client: PrismaClient) =>
        client.user.create({
            data: {
                username: data.username,
                name: data.name,
                role: data.role,
                active: data.active,
                password,
                assosiation: { connect: { id: fk_assosiation } },
            }
        });

    update = (id: string, name: string, role: AuthRole, active: boolean, client: PrismaClient) =>
        client.user.update({
            where: { id },
            data: {
                name,
                role,
                active,
                failedLoginCount: 0,
            }
        });

    setPassword = (id: string, password: string, client: PrismaClient) =>
        client.user.update({
            where: { id },
            data: { password }
        });

    removeRefreshToken = (fk_user: string, client: PrismaClient) =>
        client.refreshToken.deleteMany({
            where: { fk_user }
        });

    delete = (id: string, client: PrismaClient) =>
        client.user.delete({
            where: { id }
        });
}
