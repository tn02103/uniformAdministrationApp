import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { userArgs } from "@/types/userTypes";
import { PrismaClient } from "@prisma/client";

export class UserDBHandler {

    getUsersList = (organisationId: string, client?: PrismaClient) =>
        (client ?? prisma).user.findMany({
            where: { organisationId },
            ...userArgs,
        });

    create = (data: { username: string, name: string, role: AuthRole, active: boolean }, organisationId: string, password: string, client: PrismaClient) =>
        client.user.create({
            data: {
                username: data.username,
                name: data.name,
                email: data.username,
                role: data.role,
                active: data.active,
                password,
                organisation: { connect: { id: organisationId } },
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

    removeRefreshToken = (userId: string, client: PrismaClient) =>
        client.refreshToken.deleteMany({
            where: { userId }
        });

    delete = (id: string, client: PrismaClient) =>
        client.user.delete({
            where: { id }
        });
}
