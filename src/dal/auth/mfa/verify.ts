import { AuthenticationException, AuthenticationExceptionData } from "@/errors/Authentication";
import { prisma } from "@/lib/db";
import { TOTP } from "otpauth";
import { LogDebugLevel } from "../LogDebugLeve.enum";


export const __unsecuredVerifyTwoFactorCode = async (organisationId: string, userId: string, token: string, appId: string, logData: AuthenticationExceptionData): Promise<void> => {
    const dbApp = await prisma.twoFactorApp.findFirst({
        where: {
            id: appId,
            user: {
                id: userId,
                organisationId: organisationId
            }
        }
    });

    if (!dbApp) {
        throw new AuthenticationException("Two-factor authentication app not found", "AuthenticationFailed", LogDebugLevel.WARNING, logData);
    }

    // Verify the code
    const AppConfig = {
        digits: 6,
        period: 30,
        window: 1,
    }
    const totp = new TOTP({
        secret: dbApp.secret,
        digits: AppConfig.digits,
        period: AppConfig.period,
    });

    const validateResult = totp.validate({
        token,
        window: AppConfig.window
    });
    if (validateResult === null) {
        throw new AuthenticationException('Invalid TOTP code', "AuthenticationFailed", LogDebugLevel.INFO, logData);
    }

    return;
}
