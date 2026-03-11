/**
 * Mock Factory Functions for Authentication DAL Tests
 * 
 * Non-duplicate mock factories for auth tests.
 * For UserAgent and cookie mocks use __testHelpers__/mockData.ts:
 *   - createMockUserAgent  -> getMockUserAgent / mockUserAgentVariants
 *   - createSimpleMockCookies -> getCookieMockFactory
 *   - createMockHeaders    -> getNextHeaderMock
 */

import type { AuthenticationExceptionData } from '@/errors/Authentication';
import type { UserAgent } from '../helper';
import type { CachedRefreshData } from '../refresh/idempotency.redis';

/**
 * Creates a mock AuthenticationExceptionData object for testing.
 *
 * @example
 * const logData = createMockAuthExceptionData();
 * const customData = createMockAuthExceptionData({ ipAddress: '10.0.0.1' });
 */
export const createMockAuthExceptionData = (
    overrides?: Partial<AuthenticationExceptionData>
): AuthenticationExceptionData => {
    return {
        ipAddress: '192.168.1.1',
        userAgent: {} as UserAgent,
        ...overrides,
    };
};

/**
 * Creates a mock CachedRefreshData for Redis idempotency testing.
 *
 * @example
 * const cacheData = createMockCachedRefreshData();
 * const errorCache = createMockCachedRefreshData({ status: 403, message: 'Forbidden' });
 */
export const createMockCachedRefreshData = (
    overrides?: {
        status?: number;
        message?: string;
        ipAddress?: string;
        userAgent?: UserAgent;
        oldRefreshTokenHash?: string;
        cookieExpiry?: string;
        newRefreshTokenPlaintext?: string;
    }
): CachedRefreshData => {
    return {
        response: {
            status: overrides?.status ?? 200,
            message: overrides?.message ?? 'Success'
        },
        metadata: {
            ipAddress: overrides?.ipAddress ?? '192.168.1.1',
            userAgent: JSON.stringify(overrides?.userAgent ?? {}),
            oldRefreshTokenHash: overrides?.oldRefreshTokenHash ?? 'hash-abc123',
            cookieExpiry: overrides?.cookieExpiry ?? '2026-02-01T12:00:00Z',
            newRefreshTokenPlaintext: overrides?.newRefreshTokenPlaintext ?? 'new-token-plaintext-abc123',
        }
    };
};

/**
 * Mocks console.warn for tests that intentionally trigger warnings.
 * Remember to call mockRestore() after the test.
 *
 * @returns Jest spy instance for assertions
 * @example
 * const spy = mockConsoleWarn();
 * expect(spy).toHaveBeenCalledWith(expect.stringContaining('warning'));
 * spy.mockRestore();
 */
export const mockConsoleWarn = (): jest.SpyInstance => {
    return jest.spyOn(console, 'warn').mockImplementation();
};
