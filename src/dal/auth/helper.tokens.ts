import { AuthenticationException, AuthenticationExceptionData } from "@/errors/Authentication";
import { prisma } from "@/lib/db";
import { IronSession } from "@/lib/ironSession";
import { Organisation, User } from "@prisma/client";
import crypto, { createHash } from 'crypto';
import dayjs from "dayjs";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { UserAgent } from "./helper";
import { AuthConfig } from "./config";
import { LogDebugLevel } from "./LogDebugLeve.enum";


export function sha256Hex(s: string): string {
    return createHash('sha256').update(s, 'utf8').digest('hex');
}

// ############## ISSUE Access Token ##################
type IssueNewAccessTokenProps = {
    user: User;
    sessionId: string;
    ironSession: IronSession;
    organisation: Organisation;
}
export const issueNewAccessToken = async (props: IssueNewAccessTokenProps) => {
    const { user, ironSession, organisation, sessionId } = props;
    ironSession.user = {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        organisationId: organisation.id,
        acronym: organisation.acronym
    };
    ironSession.sessionId = sessionId;
    await ironSession.save();
}

// ############## ISSUE REFRESH TOKEN ##################
type IssueNewRefreshTokenProps = {
    cookieList: ReadonlyRequestCookies;
    userId: string;
    deviceId: string;
    sessionId: string;
    ipAddress: string;
    endOfLife?: Date;
    logData: AuthenticationExceptionData;
} & ({
    mode: "new";
    userAgent?: undefined;
    usedRefreshTokenId?: undefined,
} | {
    mode: "refresh";
    userAgent: UserAgent;
    usedRefreshTokenId: string;
})
/**
 * Issues a new refresh token for the user.
 * Uses database transaction to ensure atomic token rotation.
 * @returns The plaintext refresh token that was created
 */
export const issueNewRefreshToken = async (props: IssueNewRefreshTokenProps): Promise<string> => {
    const {
        cookieList,
        deviceId,
        userId,
        ipAddress,
        usedRefreshTokenId,
        endOfLife = dayjs().add(3, "days").toDate(),
        userAgent,
        mode,
    } = props;

    let newTokenPlaintext: string = '';

    try {
        await prisma.$transaction(async (tx) => {
            let tokenFamilyId: string;

            if (mode === "refresh") {
                // Step 1: Mark old token as used (ATOMIC)
                const oldToken = await tx.refreshToken.update({
                    where: {
                        id: usedRefreshTokenId,
                        userId: userId,
                        status: "active",
                        usedAt: null, // Database checks this atomically
                    },
                    data: {
                        usedAt: new Date(),
                        usedIpAddress: ipAddress,
                        usedUserAgent: JSON.stringify(userAgent),
                        status: "rotated",
                    }
                });

                tokenFamilyId = oldToken.tokenFamilyId;
            } else {
                // "new" mode - generate new family
                tokenFamilyId = crypto.randomUUID();
            }

            // Step 2: Revoke any other active tokens for this device
            // Ensures only one valid refresh token exists per device
            await tx.refreshToken.updateMany({
                where: {
                    deviceId: deviceId,
                    userId: userId,
                    status: "active",
                    endOfLife: { gt: new Date() },
                    ...(mode === "refresh" ? { id: { not: usedRefreshTokenId } } : {}),
                },
                data: {
                    status: "revoked",
                }
            });

            // Step 3: Create new token (same for both modes)
            const newToken = crypto.randomBytes(64).toString('base64url');
            const newTokenHash = sha256Hex(newToken);
            newTokenPlaintext = newToken; // Capture for return

            await tx.refreshToken.create({
                data: {
                    userId: userId,
                    deviceId: deviceId,
                    sessionId: props.sessionId,
                    token: newTokenHash,
                    endOfLife,
                    issuerIpAddress: ipAddress,
                    tokenFamilyId: tokenFamilyId,
                    rotatedFromTokenId: mode === "refresh" ? usedRefreshTokenId : null,
                    status: "active",
                }
            });

            // Step 4: Set cookie (done after transaction commits)
            cookieList.set(AuthConfig.refreshTokenCookie, newToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                expires: endOfLife,
                path: '/api/auth/refresh',
            });
        }, {
            isolationLevel: 'Serializable',
            timeout: 5000,
        });

        return newTokenPlaintext; // Return the plaintext token
    } catch (error) {
        // Handle race condition
        if (error && typeof error === 'object' && 'code' in error) {
            const prismaError = error as { code: string };
            if (prismaError.code === 'P2025') {
                // Record not found = token already used
                throw new AuthenticationException(
                    "Refresh token was already used (race condition or replay attack)",
                    "RefreshTokenReuseDetected",
                    LogDebugLevel.CRITICAL,
                    props.logData
                );
            }
        }
        throw error;
    }
};
