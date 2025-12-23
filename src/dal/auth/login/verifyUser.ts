import { AuthenticationException, AuthenticationExceptionData, TwoFactorRequiredException } from "@/errors/Authentication";
import { prisma } from "@/lib/db";
import { sendUserBlockedEmail } from "@/lib/email/userBlockedEmail";
import { LoginFormType } from "@/zod/auth";
import { Device, User } from "@prisma/client";
import bcrypt from 'bcrypt';
import { __unsecuredSendEmailVerifyCode } from "../email/verifyCode";
import { FingerprintValidationResult, getMFARequiredForLogin, verifyMFAToken } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";

export type VerifyUserProps = {
    user: User;
    organisationId: string;
    password: string;
    secondFactor: LoginFormType["secondFactor"];
    loginLogData: AuthenticationExceptionData;
    fingerprint: FingerprintValidationResult;
    device: Device | null;
}
/**
 * Retrieves the active user for a given email and organisation. Handles cases where user does not exists or is blocked.
 * @param props
 * @returns returns a user, or the errorResponse if not found or blocked
 */
export const verifyUser = async (props: VerifyUserProps): Promise<{ mfaMethod: null | "email" | "totp" }> => {
    const { user, organisationId, secondFactor, loginLogData, fingerprint, device } = props;
    if (user.recDelete) {
        throw new AuthenticationException("User has been deleted", "AuthenticationFailed", LogDebugLevel.WARNING, loginLogData);
    }

    if (!user.active) {
        throw new AuthenticationException("User is blocked", "User Blocked", LogDebugLevel.WARNING, loginLogData);
    }

    const isValidPassword = await bcrypt.compare(props.password, user.password);
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
                    revoked: true,
                }
            });
            await sendUserBlockedEmail(user.id);
            throw new AuthenticationException("User is now blocked due to too many failed login attempts", "User Blocked", LogDebugLevel.WARNING, loginLogData);
        }
        throw new AuthenticationException("Failed login attempt: Invalid password", "AuthenticationFailed", LogDebugLevel.INFO, loginLogData);
    }

    // 2FA Check
    if (secondFactor) {
        await verifyMFAToken(secondFactor.token, secondFactor.appId, organisationId, loginLogData);
        return {
            mfaMethod: secondFactor.appId === "email" ? "email" : "totp"
        };
    }

    const { mfaMethod } = await getMFARequiredForLogin({
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
    throw new TwoFactorRequiredException("Two factor authentication required", mfaMethod === "email" ? "email" : "totp", loginLogData);
};
