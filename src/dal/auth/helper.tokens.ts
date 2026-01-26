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
 */
export const issueNewRefreshToken = async (props: IssueNewRefreshTokenProps) => {
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

    let oldToken;
    if (mode === "refresh") {
        // Mark the used refresh token as used
        oldToken = await prisma.refreshToken.update({
            where: {
                id: usedRefreshTokenId,
                userId: userId,
                status: "active",
                usedAt: null,
            },
            data: {
                usedAt: new Date(),
                usedIpAddress: ipAddress,
                usedUserAgent: JSON.stringify(userAgent),
            }
        });
        if (oldToken === null) {
            throw new AuthenticationException("Used refresh token not found or already used", "AuthenticationFailed", LogDebugLevel.WARNING, props.logData);
        }
    }

    // Invalidate any other existing refreshTokens (should not be the case)
    await prisma.refreshToken.updateMany({
        where: {
            deviceId: deviceId,
            userId: userId,
            status: "active",
            endOfLife: { gt: new Date() },
        },
        data: {
            status: "revoked",
        }
    });

    // Create new refresh Token
    const newToken = crypto.randomBytes(64).toString('base64url');
    const newTokenHash = sha256Hex(newToken);

    // Store hash of new refresh token in DB
    await prisma.refreshToken.create({
        data: {
            userId: userId,
            deviceId: deviceId,
            sessionId: props.sessionId,
            token: newTokenHash,
            endOfLife,
            issuerIpAddress: ipAddress,
            tokenFamilyId: oldToken ? oldToken.tokenFamilyId : crypto.randomUUID(),
            rotatedFromTokenId: oldToken ? oldToken.id : null,
            status: "active",
        }
    });
    // Set Refreshtoken cookie
    cookieList.set(AuthConfig.refreshTokenCookie, newToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: endOfLife,
        path: '/api/auth/refresh',
    });
}
