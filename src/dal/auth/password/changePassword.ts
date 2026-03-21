import { genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { ChangePasswordDALSchema, ChangePasswordDALType } from "@/zod/auth";
import bcrypt from "bcrypt";
import { RateLimiterMemory } from "rate-limiter-flexible";

const SALT_ROUNDS = 12;

const userRateLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60 * 15, // 15 minutes
});

type ChangePasswordError =
    | { error: { formElement: "currentPassword"; message: string } }
    | { error: { tooManyRequests: true } };

export const changePassword = async (data: ChangePasswordDALType): Promise<void | ChangePasswordError> => {
    const [user, { currentPassword, newPassword }] = await genericSAValidator(
        AuthRole.user,
        data,
        ChangePasswordDALSchema,
    );

    const limit = await userRateLimiter.get(user.id);
    if (limit !== null && limit.remainingPoints <= 0) {
        return { error: { tooManyRequests: true } };
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
        return { error: { formElement: "currentPassword", message: "custom.auth.invalidCurrentPassword" } };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedNewPassword,
            changePasswordOnLogin: false,
        },
    });

    const ironSession = await getIronSession();
    const currentSessionId = ironSession.sessionId;

    await prisma.session.updateMany({
        where: {
            device: { userId: user.id },
            valid: true,
            ...(currentSessionId ? { NOT: { id: currentSessionId } } : {}),
        },
        data: { valid: false },
    });

    await prisma.refreshToken.deleteMany({
        where: {
            userId: user.id,
            ...(currentSessionId ? { NOT: { sessionId: currentSessionId } } : {}),
        },
    });
};
