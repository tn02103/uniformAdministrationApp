/**
 * Mock Factory Functions for Authentication DAL Tests
 * 
 * Centralized mock object creation for consistent testing across auth modules.
 * Provides type-safe factories for UserAgent, Cookies, Headers, and other common mocks.
 */

import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';
import type { UserAgent } from '../helper';
import { AuthConfig } from '../config';
import type { AuthenticationExceptionData } from '@/errors/Authentication';
import type { CachedRefreshData } from '../refresh/idempotency.redis';

// ============ USER AGENT MOCKS ============

/**
 * Creates a mock UserAgent object with common browser/device configurations.
 * 
 * @param variant - Predefined browser/device combination
 * @returns Complete UserAgent object suitable for testing
 * 
 * @example
 * const agent = createMockUserAgent('chrome-desktop');
 * const mobileAgent = createMockUserAgent('firefox-mobile');
 */
export const createMockUserAgent = (
    variant: 'chrome-desktop' | 'firefox-mobile' | 'safari-desktop' | 'edge-desktop' = 'chrome-desktop'
): UserAgent => {
    const variants = {
        'chrome-desktop': {
            browser: { name: 'Chrome', version: '120', major: '120' },
            device: { type: 'desktop' as const, vendor: undefined, model: undefined },
            os: { name: 'Windows', version: '10' },
            engine: { name: 'Blink', version: '120' },
            cpu: { architecture: 'amd64' },
            ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0',
            isBot: false,
        },
        'firefox-mobile': {
            browser: { name: 'Firefox', version: '115', major: '115' },
            device: { type: 'mobile' as const, vendor: undefined, model: undefined },
            os: { name: 'Android', version: '13' },
            engine: { name: 'Gecko', version: '115' },
            cpu: { architecture: 'arm' },
            ua: 'Mozilla/5.0 (Android 13) Gecko/115.0 Firefox/115.0',
            isBot: false,
        },
        'safari-desktop': {
            browser: { name: 'Safari', version: '16', major: '16' },
            device: { type: 'desktop' as const, vendor: 'Apple', model: undefined },
            os: { name: 'macOS', version: '13' },
            engine: { name: 'WebKit', version: '16' },
            cpu: { architecture: 'amd64' },
            ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) Safari/16.0',
            isBot: false,
        },
        'edge-desktop': {
            browser: { name: 'Edge', version: '120', major: '120' },
            device: { type: 'desktop' as const, vendor: undefined, model: undefined },
            os: { name: 'Windows', version: '11' },
            engine: { name: 'Blink', version: '120' },
            cpu: { architecture: 'amd64' },
            ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0',
            isBot: false,
        },
    };
    
    return variants[variant] as UserAgent;
};

// ============ COOKIE MOCKS ============

/**
 * Creates a mock ReadonlyRequestCookies with full functionality.
 * Maintains internal state for get/set operations.
 * 
 * @param options.refreshToken - Optional refresh token to pre-populate
 * @param options.trackSet - If true, exposes __mockSet for assertions
 * @returns Mock cookies object with optional set tracking
 * 
 * @example
 * const cookies = createMockCookies({ refreshToken: 'token123' });
 * const trackedCookies = createMockCookies({ trackSet: true });
 * expect(trackedCookies.__mockSet).toHaveBeenCalledWith('cookie-name', 'value');
 */
export const createMockCookies = (options?: {
    refreshToken?: string;
    trackSet?: boolean;
}): ReadonlyRequestCookies & { __mockSet?: jest.Mock } => {
    const cookies = new Map<string, string>();
    
    if (options?.refreshToken) {
        cookies.set(AuthConfig.refreshTokenCookie, options.refreshToken);
    }

    const mockSet = jest.fn((name, value) => {
        cookies.set(name, value);
    });

    const mock = {
        get: (name: string) => {
            const value = cookies.get(name);
            return value ? { name, value } : undefined;
        },
        getAll: (name?: string) => {
            if (name) {
                const value = cookies.get(name);
                return value ? [{ name, value }] : [];
            }
            return Array.from(cookies.entries()).map(([name, value]) => ({ name, value }));
        },
        has: (name: string) => cookies.has(name),
        set: mockSet,
        [Symbol.iterator]: function* () {
            for (const [name, value] of cookies.entries()) {
                yield { name, value };
            }
        },
        size: cookies.size,
    } as unknown as ReadonlyRequestCookies;

    if (options?.trackSet) {
        (mock as ReadonlyRequestCookies & { __mockSet: jest.Mock }).__mockSet = mockSet;
    }

    return mock;
};

/**
 * Creates a simplified mock for unit tests where only 'set' method is called.
 * Useful when you don't need full cookie functionality.
 * 
 * @returns Mock with only set method and exposed mock function for assertions
 * 
 * @example
 * const cookies = createSimpleMockCookies();
 * someFunction(cookies);
 * expect(cookies.__mockSet).toHaveBeenCalledWith('name', 'value');
 */
export const createSimpleMockCookies = (): ReadonlyRequestCookies & { __mockSet: jest.Mock } => {
    const mockSet = jest.fn();
    return {
        set: mockSet,
        __mockSet: mockSet,
    } as unknown as ReadonlyRequestCookies & { __mockSet: jest.Mock };
};

// ============ HEADER MOCKS ============

/**
 * Creates a mock ReadonlyHeaders for HTTP request simulation.
 * Handles common headers like IP address and user-agent.
 * 
 * @param options.ipAddress - IP address to return for IP-related headers
 * @param options.userAgent - User-agent string to return
 * @returns Mock headers object
 * 
 * @example
 * const headers = createMockHeaders({ ipAddress: '10.0.0.1' });
 * const customHeaders = createMockHeaders({ 
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Custom/1.0' 
 * });
 */
export const createMockHeaders = (options?: {
    ipAddress?: string;
    userAgent?: string;
}): ReadonlyHeaders => {
    const ip = options?.ipAddress ?? '192.168.1.1';
    const ua = options?.userAgent ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0';
    
    return {
        get: (name: string) => {
            if (name === 'true-client-ip' || name === 'x-forwarded-for') return ip;
            if (name === 'user-agent') return ua;
            return null;
        },
    } as unknown as ReadonlyHeaders;
};

// ============ LOG DATA MOCKS ============

/**
 * Creates a mock AuthenticationExceptionData object for testing.
 * Provides sensible defaults that can be overridden.
 * 
 * @param overrides - Partial object to override default values
 * @returns Complete AuthenticationExceptionData object
 * 
 * @example
 * const logData = createMockAuthExceptionData();
 * const customData = createMockAuthExceptionData({ 
 *   userId: 'user-123',
 *   organisationId: 'org-456' 
 * });
 */
export const createMockAuthExceptionData = (
    overrides?: Partial<AuthenticationExceptionData>
): AuthenticationExceptionData => {
    return {
        ipAddress: '192.168.1.1',
        userAgent: createMockUserAgent('chrome-desktop'),
        ...overrides,
    };
};

// ============ CACHED REFRESH DATA MOCKS ============

/**
 * Creates a mock CachedRefreshData for Redis idempotency testing.
 * Includes both response and metadata with sensible defaults.
 * 
 * @param overrides - Optional overrides for specific fields
 * @returns Complete CachedRefreshData object
 * 
 * @example
 * const cacheData = createMockCachedRefreshData();
 * const errorCache = createMockCachedRefreshData({ 
 *   status: 403, 
 *   message: 'Forbidden' 
 * });
 */
export const createMockCachedRefreshData = (
    overrides?: {
        status?: number;
        message?: string;
        ipAddress?: string;
        userAgent?: UserAgent;
        oldRefreshTokenHash?: string;
        cookieExpiry?: Date;
        newRefreshTokenPlaintext?: string;
    }
): CachedRefreshData => {
    const userAgent = overrides?.userAgent ?? createMockUserAgent('chrome-desktop');
    
    return {
        response: { 
            status: overrides?.status ?? 200, 
            message: overrides?.message ?? 'Success' 
        },
        metadata: {
            ipAddress: overrides?.ipAddress ?? '192.168.1.1',
            userAgent: JSON.stringify(userAgent),
            oldRefreshTokenHash: overrides?.oldRefreshTokenHash ?? 'hash-abc123',
            cookieExpiry: overrides?.cookieExpiry ?? new Date('2026-02-01T12:00:00Z'),
            newRefreshTokenPlaintext: overrides?.newRefreshTokenPlaintext ?? 'new-token-plaintext-abc123',
        }
    };
};

// ============ CONSOLE MOCKS ============

/**
 * Mocks console.warn for tests that intentionally trigger warnings.
 * Remember to call mockRestore() after the test.
 * 
 * @returns Jest spy instance for assertions
 * 
 * @example
 * const spy = mockConsoleWarn();
 * // ... code that logs warnings
 * expect(spy).toHaveBeenCalledWith(expect.stringContaining('warning'));
 * spy.mockRestore();
 */
export const mockConsoleWarn = (): jest.SpyInstance => {
    return jest.spyOn(console, 'warn').mockImplementation();
};

/**
 * Mocks console.error for tests that intentionally trigger errors.
 * Remember to call mockRestore() after the test.
 * 
 * @returns Jest spy instance for assertions
 * 
 * @example
 * const spy = mockConsoleError();
 * // ... code that logs errors
 * expect(spy).toHaveBeenCalled();
 * spy.mockRestore();
 */
export const mockConsoleError = (): jest.SpyInstance => {
    return jest.spyOn(console, 'error').mockImplementation();
};

/**
 * Executes a test function with mocked console logging.
 * Automatically restores console after test completion.
 * 
 * @param level - Console level to mock ('warn' or 'error')
 * @param testFn - Test function to execute with mocked console
 * @returns The spy instance for additional assertions
 * 
 * @example
 * const spy = await withMockedConsole('warn', async () => {
 *   await functionThatWarns();
 * });
 * expect(spy).toHaveBeenCalledTimes(2);
 */
export const withMockedConsole = async (
    level: 'warn' | 'error',
    testFn: () => void | Promise<void>
): Promise<jest.SpyInstance> => {
    const spy = jest.spyOn(console, level).mockImplementation();
    try {
        await testFn();
        return spy;
    } finally {
        spy.mockRestore();
    }
};
