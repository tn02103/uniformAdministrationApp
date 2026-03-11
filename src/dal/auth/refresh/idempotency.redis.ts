import { isRedisAvailable } from "../redis";
import type { UserAgent } from "../helper";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { handleRetryRequest } from "./handleRetryRequest";

/**
 * Type for cached refresh token data with metadata for validation
 */
export type CachedRefreshData = {
    response: {
        status: number;
        message: string;
    };
    metadata: {
        ipAddress: string;
        userAgent: string;  // JSON stringified
        oldRefreshTokenHash: string;
        cookieExpiry: string; // ISO string
        newRefreshTokenPlaintext: string;
    };
};

/**
 * Result of attempting to acquire a lock with idempotency checking
 */
export type LockAcquisitionResult = {
    lockAcquired: true;
} | {
    lockAcquired: false;
    cachedResponse: {
        status: number;
        message: string;
    };
};

/**
 * Attempts to acquire a distributed lock for an idempotency key
 * @param key - The idempotency key
 * @returns true if lock acquired, false if lock already held by another request
 */
export const acquireLock = async (key: string): Promise<boolean> => {
    if (!isRedisAvailable()) {
        return true; // No Redis = no locking, proceed normally
    }

    try {
        const { redis } = await import("../redis");
        const lockKey = `idempotency:${key}:lock`;
        
        // SET with NX (only if not exists) and EX (expire in 5 seconds)
        const result = await redis!.set(lockKey, 'processing', 'EX', 5, 'NX');
        
        return result === 'OK';
    } catch (error) {
        console.warn('Redis lock acquisition error, proceeding without lock:', error);
        return true; // Fail open - allow processing
    }
};

/**
 * Releases a distributed lock for an idempotency key
 * @param key - The idempotency key
 */
export const releaseLock = async (key: string): Promise<void> => {
    if (!isRedisAvailable()) {
        return;
    }

    try {
        const { redis } = await import("../redis");
        const lockKey = `idempotency:${key}:lock`;
        
        await redis!.del(lockKey);
        console.debug(`Released lock for idempotency key: ${key}`);
    } catch (error) {
        console.warn('Redis lock release error:', error);
    }
};

/**
 * Stores the cached result of a successful token refresh
 * @param key - The idempotency key
 * @param data - The cached refresh data with metadata
 */
export const storeCachedResult = async (key: string, data: CachedRefreshData): Promise<void> => {
    if (!isRedisAvailable()) {
        return;
    }

    try {
        const { redis } = await import("../redis");
        const resultKey = `idempotency:${key}:result`;
        
        await redis!.setex(
            resultKey,
            30, // 30 second TTL
            JSON.stringify(data)
        );
        console.debug(`Cached result for idempotency key: ${key}`);
    } catch (error) {
        console.warn('Failed to cache refresh result:', error);
    }
};

/**
 * Retrieves a cached refresh result if available
 * @param key - The idempotency key
 * @returns The cached data or null if not found
 */
export const getCachedResult = async (key: string): Promise<CachedRefreshData | null> => {
    if (!isRedisAvailable()) {
        return null;
    }

    try {
        const { redis } = await import("../redis");
        const resultKey = `idempotency:${key}:result`;
        
        const cached = await redis!.get(resultKey);
        if (!cached) {
            return null;
        }
        
        return JSON.parse(cached) as CachedRefreshData;
    } catch (error) {
        console.warn('Failed to retrieve cached result:', error);
        return null;
    }
};

/**
 * Attempts to acquire a lock for an idempotency key, with polling if lock is held.
 * If another request holds the lock, polls for the cached result and validates it.
 * 
 * @param idempotencyKey - The idempotency key for this request
 * @param ipAddress - Current request IP address for metadata validation
 * @param agent - Current request user agent for metadata validation
 * @param refreshTokenValue - Current refresh token value for metadata validation
 * @param cookieList - Cookie list for setting refresh token on cache hit
 * @returns Lock acquisition result - either lock acquired or cached response
 */
export const tryAcquireLockWithPolling = async (
    idempotencyKey: string,
    ipAddress: string,
    agent: UserAgent,
    refreshTokenValue: string | undefined,
    cookieList: ReadonlyRequestCookies
): Promise<LockAcquisitionResult> => {
    // Try to acquire lock
    const lockAcquired = await acquireLock(idempotencyKey);

    if (lockAcquired) {
        return { lockAcquired: true };
    }

    // Lock held by another request - POLL for result
    console.debug('Another request is processing, waiting for result...');

    const maxWaitTime = 5000; // 5 seconds
    const pollInterval = 100; // 100ms
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
        const cachedData = await getCachedResult(idempotencyKey);
        if (cachedData) {
            // Validate metadata before returning cached response
            if (!refreshTokenValue) {
                return {
                    lockAcquired: false,
                    cachedResponse: { status: 401, message: "Refresh token missing" }
                };
            }

            const validationResult = await handleRetryRequest(
                cachedData,
                ipAddress,
                agent,
                refreshTokenValue,
                cookieList
            );

            if (validationResult) {
                return {
                    lockAcquired: false,
                    cachedResponse: validationResult
                };
            }
            
            // Validation failed (403), return error response
            return {
                lockAcquired: false,
                cachedResponse: { status: 403, message: "Invalid retry request" }
            };
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Timeout - lock holder might have crashed
    console.warn('Timeout waiting for parallel request result');
    return {
        lockAcquired: false,
        cachedResponse: {
            status: 503,
            message: "Token refresh timeout - please retry"
        }
    };
};
