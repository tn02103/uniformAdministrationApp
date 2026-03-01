import { Prisma } from "@/prisma/client";

export const userArgs = {
    select: {
        id: true,
        username: true,
        name: true,
        active: true,
        role: true
    },
    orderBy: { username: "asc"}
} satisfies Prisma.UserFindManyArgs;

export type User = Prisma.UserGetPayload<typeof userArgs>
