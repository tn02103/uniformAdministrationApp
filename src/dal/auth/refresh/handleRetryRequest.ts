import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { sha256Hex } from "../helper.tokens";
import { logSecurityAuditEntry, type UserAgent } from "../helper";
import { LogDebugLevel } from "../LogDebugLeve.enum";
import { AuthConfig } from "../config";
import type { CachedRefreshData } from "./idempotency.redis";

type RefreshResponse = {
    status: number;
    message: string;
};

/**
 * Validates a retry request against cached metadata and returns the cached response if valid.
 * 
 * Security checks:
 * - Refresh token must match (403 CRITICAL if mismatch)
 * - User Agent must match (403 CRITICAL if mismatch)
 * - IP address mismatch is allowed but logged as WARNING (mobile network switching)
 * 
 * @param cachedData - The cached refresh data with metadata
 * @param currentIpAddress - The IP address of the current retry request
 * @param currentAgent - The user agent of the current retry request
 * @param currentRefreshTokenValue - The refresh token value from the current request
 * @param cookieList - Cookie list to set the new refresh token cookie
 * @returns The cached response if validation passes, null if validation fails (403 response)
 */
export const handleRetryRequest = async (
    cachedData: CachedRefreshData,
    currentIpAddress: string,
    currentAgent: UserAgent,
    currentRefreshTokenValue: string,
    cookieList: ReadonlyRequestCookies
): Promise<RefreshResponse | null> => {
    const currentRefreshTokenHash = sha256Hex(currentRefreshTokenValue);

    // CHECK 1: Refresh token must match (CRITICAL - prevents stolen idempotency key attacks)
    if (currentRefreshTokenHash !== cachedData.metadata.oldRefreshTokenHash) {
        console.warn('Idempotency key reuse with different refresh token - potential attack');
        await logSecurityAuditEntry({
            success: false,
            ipAddress: currentIpAddress,
            details: "Idempotency key reuse with mismatched refresh token - potential replay attack",
            action: "REFRESH_ACCESS_TOKEN",
            userAgent: currentAgent,
            debugLevel: LogDebugLevel.CRITICAL
        });
        return { status: 403, message: "Invalid retry request" };
    }

    // CHECK 2: User Agent must match (CRITICAL - legitimate clients don't change UA)
    const cachedUA = JSON.stringify(JSON.parse(cachedData.metadata.userAgent));
    const currentUA = JSON.stringify(currentAgent);
    if (cachedUA !== currentUA) {
        console.warn('Idempotency key reuse with different User Agent - potential attack');
        await logSecurityAuditEntry({
            success: false,
            ipAddress: currentIpAddress,
            details: "Idempotency key reuse with different User Agent - potential replay attack",
            action: "REFRESH_ACCESS_TOKEN",
            userAgent: currentAgent,
            debugLevel: LogDebugLevel.CRITICAL
        });
        return { status: 403, message: "Invalid retry request" };
    }

    // CHECK 3: IP address (ALLOW but log WARNING if mismatch - mobile users switching towers)
    if (currentIpAddress !== cachedData.metadata.ipAddress) {
        console.warn('Idempotency key reuse from different IP (allowed for mobile)');
        await logSecurityAuditEntry({
            success: true,
            ipAddress: currentIpAddress,
            details: `Legitimate retry from different IP. Original: ${cachedData.metadata.ipAddress}, Current: ${currentIpAddress}`,
            action: "REFRESH_ACCESS_TOKEN",
            userAgent: currentAgent,
            debugLevel: LogDebugLevel.WARNING
        });
    }

    // All checks passed - re-set the cookie with NEW refresh token
    console.debug('Returning cached refresh response to legitimate retry');
    cookieList.set(
        AuthConfig.refreshTokenCookie,
        cachedData.metadata.newRefreshTokenPlaintext,
        {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            expires: cachedData.metadata.cookieExpiry,
            path: '/api/auth/refresh',
        }
    );

    return cachedData.response;
};
