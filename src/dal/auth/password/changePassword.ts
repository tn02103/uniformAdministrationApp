import { genericSAValidator } from "@/actions/validations";
import { InvalidCurrentPasswordError, TooManyRequestsError } from "@/errors/Authentication";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { ChangePasswordDALSchema, ChangePasswordDALType } from "@/zod/auth";
import bcrypt from "bcrypt";
import { RateLimiterMemory } from "rate-limiter-flexible";

const SALT_ROUNDS = 12;

const userRateLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60 * 15, // 15 minutes
});

export const changePassword = async (data: ChangePasswordDALType): Promise<void> => {
    const [user, { currentPassword, newPassword }] = await genericSAValidator(
        AuthRole.user,
        data,
        ChangePasswordDALSchema,
    );

    const limit = await userRateLimiter.get(user.id);
    if (limit !== null && limit.remainingPoints <= 0) {
        throw new TooManyRequestsError();
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true },
    });

    if (!dbUser) {
        throw new Error("User not found");
    }

    const isValid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isValid) {
        await userRateLimiter.consume(user.id);
        throw new InvalidCurrentPasswordError();
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedNewPassword,
            changePasswordOnLogin: false,
        },
    });

    await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
    });
};
