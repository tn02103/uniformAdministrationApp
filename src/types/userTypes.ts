import { Prisma } from "@prisma/client";

export const deviceArgs = Prisma.validator<Prisma.DeviceFindManyArgs>()({
    select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        lastLoginAt: true,
    },
});

export const userArgs = Prisma.validator<Prisma.UserFindManyArgs>()({
    select: {
        id: true,
        email: true,
        name: true,
        active: true,
        role: true,
        devices: true,
        lastLoginAt: true,
        organisationId: true,
    },
    orderBy: { name: "asc" },

});

export type User = Prisma.UserGetPayload<typeof userArgs>
