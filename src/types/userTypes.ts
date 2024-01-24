import { Prisma } from "@prisma/client";

export const userArgs = Prisma.validator<Prisma.UserArgs>()({
    select: {
        id: true,
        username: true,
        name: true,
        active: true,
        role: true
    }
});

export type User = Prisma.UserGetPayload<typeof userArgs>
