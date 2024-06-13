import { Prisma } from "@prisma/client";

export const userArgs = Prisma.validator<Prisma.UserFindManyArgs>()({
    select: {
        id: true,
        username: true,
        name: true,
        active: true,
        role: true
    },
    orderBy: { username: "asc"}
});

export type User = Prisma.UserGetPayload<typeof userArgs>
