import { AuthenticationException, TwoFactorRequiredException } from "@/errors/Authentication";
import { prisma } from "@/lib/db";
import { sendUserBlockedEmail } from "@/lib/email/userBlockedEmail";
import { LoginFormType } from "@/zod/auth";
import bcrypt from 'bcrypt';
import { UserLoginData } from ".";
import { __unsecuredSendEmailVerifyCode } from "../email/verifyCode";
import { verifyMFAToken } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { checkMFARequired } from "./checkMFARequired";

export type VerifyUserProps = {
    userData: UserLoginData;
    loginFormData: LoginFormType;
}
/**
 * Retrieves the active user for a given email and organisation. Handles cases where user does not exists or is blocked.
 * @param props
 * @returns returns a user, or the errorResponse if not found or blocked
 */
export const verifyUser = async (props: VerifyUserProps): Promise<{ mfaMethod: null | "email" | "totp" }> => {
    const { userData, loginFormData } = props;
    const { user, organisationId, fingerprint, device } = userData;
    if (user.recDelete) {
        throw new AuthenticationException("User has been deleted", "AuthenticationFailed", LogDebugLevel.WARNING, userData);
    }

    if (!user.active) {
        throw new AuthenticationException("User is blocked", "User Blocked", LogDebugLevel.WARNING, userData);
    }

    const isValidPassword = await bcrypt.compare(loginFormData.password, user.password);
    if (!isValidPassword) {
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginCount: { increment: 1 } }
        });
        if (updatedUser.failedLoginCount >= 10) {
            await prisma.user.update({
                where: { id: user.id },
                data: { active: false }
            });
            await prisma.refreshToken.updateMany({
                where: {
                    userId: user.id,
                },
                data: {
                    status: "revoked",
                }
            });
            await sendUserBlockedEmail(user.id);
            throw new AuthenticationException("User is now blocked due to too many failed login attempts", "User Blocked", LogDebugLevel.WARNING, userData);
        }
        throw new AuthenticationException("Failed login attempt: Invalid password", "AuthenticationFailed", LogDebugLevel.INFO, userData);
    }

    // 2FA Check
    const { secondFactor } = loginFormData;
    if (secondFactor) {
        await verifyMFAToken(secondFactor.token, secondFactor.appId, organisationId, userData);
        return {
            mfaMethod: secondFactor.appId === "email" ? "email" : "totp"
        };
    }

    const { mfaMethod } = await checkMFARequired({
        userId: user.id,
        riskLevel: fingerprint.riskLevel,
        device
    });
    if (mfaMethod === null) {
        return { mfaMethod: null };
    }

    if (mfaMethod === "email") {
        await __unsecuredSendEmailVerifyCode(organisationId, user.id);
    }
    throw new TwoFactorRequiredException("Two factor authentication required", mfaMethod === "email" ? "email" : "totp", userData);
};
