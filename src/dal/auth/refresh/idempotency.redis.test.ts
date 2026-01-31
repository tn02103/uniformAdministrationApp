/**
 * Unit Tests for Redis Idempotency Helper Functions
 * 
 * Tests Redis lock acquisition, polling, and caching operations.
 * All tests use mocked Redis to ensure fast execution and predictability.
 */

import { acquireLock, getCachedResult, releaseLock, storeCachedResult, tryAcquireLockWithPolling } from './idempotency.redis';
import { 
    createMockUserAgent, 
    createSimpleMockCookies, 
    createMockCachedRefreshData,
    mockConsoleWarn 
} from '../__testHelpers__';

// Mock Redis module
const mockRedisSet = jest.fn();
const mockRedisDel = jest.fn();
const mockRedisSetex = jest.fn();
const mockRedisGet = jest.fn();
const mockIsRedisAvailable = jest.fn(() => true);

jest.mock('../redis', () => ({
    isRedisAvailable: mockIsRedisAvailable,
    redis: {
        set: mockRedisSet,
        del: mockRedisDel,
        setex: mockRedisSetex,
        get: mockRedisGet,
    }
}));

// Mock handleRetryRequest
const mockHandleRetryRequest = jest.fn();
jest.mock('./handleRetryRequest', () => ({
    handleRetryRequest: mockHandleRetryRequest,
}));

describe('Redis Idempotency Helpers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsRedisAvailable.mockReturnValue(true);
    });

    describe('acquireLock', () => {
        it('should return true when lock is acquired (SET returns OK)', async () => {
            mockRedisSet.mockResolvedValue('OK');

            const result = await acquireLock('test-key-123');

            expect(result).toBe(true);
            expect(mockRedisSet).toHaveBeenCalledWith(
                'idempotency:test-key-123:lock',
                'processing',
                'EX',
                5,
                'NX'
            );
        });

        it('should return false when lock is already held (SET returns null)', async () => {
            mockRedisSet.mockResolvedValue(null);

            const result = await acquireLock('test-key-123');

            expect(result).toBe(false);
        });

        it('should return true (fail-open) when Redis is unavailable', async () => {
            mockIsRedisAvailable.mockReturnValue(false);

            const result = await acquireLock('test-key-123');

            expect(result).toBe(true);
            expect(mockRedisSet).not.toHaveBeenCalled();
        });

        it('should handle Redis errors gracefully and return true (fail-open)', async () => {
            mockRedisSet.mockRejectedValue(new Error('Redis connection failed'));
            const consoleWarnSpy = mockConsoleWarn();

            const result = await acquireLock('test-key-123');

            expect(result).toBe(true);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Redis lock acquisition error'),
                expect.any(Error)
            );
            consoleWarnSpy.mockRestore();
        });
    });

    describe('releaseLock', () => {
        it('should call DEL with correct key format', async () => {
            mockRedisDel.mockResolvedValue(1);

            await releaseLock('test-key-123');

            expect(mockRedisDel).toHaveBeenCalledWith('idempotency:test-key-123:lock');
        });

        it('should handle Redis unavailable gracefully', async () => {
            mockIsRedisAvailable.mockReturnValue(false);

            await releaseLock('test-key-123');

            expect(mockRedisDel).not.toHaveBeenCalled();
        });

        it('should log warning on error but not throw', async () => {
            mockRedisDel.mockRejectedValue(new Error('DEL failed'));
            const consoleWarnSpy = mockConsoleWarn();

            await expect(releaseLock('test-key-123')).resolves.toBeUndefined();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Redis lock release error'),
                expect.any(Error)
            );
            consoleWarnSpy.mockRestore();
        });
    });

    describe('storeCachedResult', () => {
        const mockCacheData = createMockCachedRefreshData({
            oldRefreshTokenHash: 'hash123',
        });

        it('should call setex with 30s TTL and correct JSON', async () => {
            mockRedisSetex.mockResolvedValue('OK');

            await storeCachedResult('test-key-123', mockCacheData);

            expect(mockRedisSetex).toHaveBeenCalledWith(
                'idempotency:test-key-123:result',
                30,
                JSON.stringify(mockCacheData)
            );
        });

        it('should handle Redis unavailable gracefully', async () => {
            mockIsRedisAvailable.mockReturnValue(false);

            await storeCachedResult('test-key-123', mockCacheData);

            expect(mockRedisSetex).not.toHaveBeenCalled();
        });

        it('should log warning on error but not throw', async () => {
            mockRedisSetex.mockRejectedValue(new Error('SETEX failed'));
            const consoleWarnSpy = mockConsoleWarn();

            await expect(storeCachedResult('test-key-123', mockCacheData)).resolves.toBeUndefined();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to cache refresh result'),
                expect.any(Error)
            );
            consoleWarnSpy.mockRestore();
        });
    });

    describe('getCachedResult', () => {
        const mockCacheData = createMockCachedRefreshData({
            oldRefreshTokenHash: 'hash123',
        });

        it('should return parsed CachedRefreshData when found', async () => {
            mockRedisGet.mockResolvedValue(JSON.stringify(mockCacheData));

            const result = await getCachedResult('test-key-123');

            expect(result).toEqual(mockCacheData);
            expect(mockRedisGet).toHaveBeenCalledWith('idempotency:test-key-123:result');
        });

        it('should return null when not found', async () => {
            mockRedisGet.mockResolvedValue(null);

            const result = await getCachedResult('test-key-123');

            expect(result).toBeNull();
        });

        it('should return null when Redis unavailable', async () => {
            mockIsRedisAvailable.mockReturnValue(false);

            const result = await getCachedResult('test-key-123');

            expect(result).toBeNull();
            expect(mockRedisGet).not.toHaveBeenCalled();
        });

        it('should return null on error', async () => {
            mockRedisGet.mockRejectedValue(new Error('GET failed'));
            const consoleWarnSpy = mockConsoleWarn();

            const result = await getCachedResult('test-key-123');

            expect(result).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalled();
            consoleWarnSpy.mockRestore();
        });
    });

    describe('tryAcquireLockWithPolling', () => {
        const mockAgent = createMockUserAgent('chrome-desktop');
        const mockCookies = createSimpleMockCookies();

        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should return {lockAcquired: true} when lock acquired immediately', async () => {
            mockRedisSet.mockResolvedValue('OK');

            const result = await tryAcquireLockWithPolling(
                'test-key-123',
                '192.168.1.1',
                mockAgent,
                'token-value',
                mockCookies
            );

            expect(result).toEqual({ lockAcquired: true });
            expect(mockRedisSet).toHaveBeenCalled();
        });

        it('should poll and return cached response when found', async () => {
            mockRedisSet.mockResolvedValue(null); // Lock held
            
            const mockCacheData = createMockCachedRefreshData({
                oldRefreshTokenHash: 'hash123',
            });

            mockRedisGet
                .mockResolvedValueOnce(null) // First poll - not ready
                .mockResolvedValueOnce(null) // Second poll - not ready
                .mockResolvedValueOnce(JSON.stringify(mockCacheData)); // Third poll - found!

            mockHandleRetryRequest.mockResolvedValue({ status: 200, message: 'Cached' });

            const promise = tryAcquireLockWithPolling(
                'test-key-123',
                '192.168.1.1',
                mockAgent,
                'token-value',
                mockCookies
            );

            // Advance timers to trigger polling
            await jest.advanceTimersByTimeAsync(250); // 3 polls at 100ms each

            const result = await promise;

            expect(result).toEqual({
                lockAcquired: false,
                cachedResponse: { status: 200, message: 'Cached' }
            });
            expect(mockRedisGet).toHaveBeenCalledTimes(3);
        });

        it('should return 401 when refreshToken is missing', async () => {
            mockRedisSet.mockResolvedValue(null);
            mockRedisGet.mockResolvedValue(JSON.stringify({
                response: { status: 200, message: 'Success' },
                metadata: {}
            }));

            const promise = tryAcquireLockWithPolling(
                'test-key-123',
                '192.168.1.1',
                mockAgent,
                undefined, // Missing token
                mockCookies
            );

            await jest.advanceTimersByTimeAsync(100);

            const result = await promise;

            expect(result).toEqual({
                lockAcquired: false,
                cachedResponse: { status: 401, message: 'Refresh token missing' }
            });
        });

        it('should return 403 when validation fails', async () => {
            mockRedisSet.mockResolvedValue(null);
            mockRedisGet.mockResolvedValue(JSON.stringify({
                response: { status: 200, message: 'Success' },
                metadata: {
                    ipAddress: '192.168.1.1',
                    userAgent: JSON.stringify(mockAgent),
                    oldRefreshTokenHash: 'hash123',
                    cookieExpiry: new Date('2026-02-01'),
                    newRefreshTokenPlaintext: 'new-token',
                }
            }));

            mockHandleRetryRequest.mockResolvedValue(null); // Validation failed

            const promise = tryAcquireLockWithPolling(
                'test-key-123',
                '192.168.1.1',
                mockAgent,
                'token-value',
                mockCookies
            );

            await jest.advanceTimersByTimeAsync(100);

            const result = await promise;

            expect(result).toEqual({
                lockAcquired: false,
                cachedResponse: { status: 403, message: 'Invalid retry request' }
            });
        });

        it('should return 503 timeout after 5 seconds', async () => {
            mockRedisSet.mockResolvedValue(null); // Lock held
            mockRedisGet.mockResolvedValue(null); // Never returns data
            const consoleWarnSpy = mockConsoleWarn();

            const promise = tryAcquireLockWithPolling(
                'test-key-123',
                '192.168.1.1',
                mockAgent,
                'token-value',
                mockCookies
            );

            await jest.advanceTimersByTimeAsync(5100); // Just over 5 seconds

            const result = await promise;

            expect(result).toEqual({
                lockAcquired: false,
                cachedResponse: {
                    status: 503,
                    message: 'Token refresh timeout - please retry'
                }
            });
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Timeout waiting for parallel request')
            );
            consoleWarnSpy.mockRestore();
        });

        it('should poll approximately every 100ms', async () => {
            mockRedisSet.mockResolvedValue(null);
            mockRedisGet.mockResolvedValue(null);

            const promise = tryAcquireLockWithPolling(
                'test-key-123',
                '192.168.1.1',
                mockAgent,
                'token-value',
                mockCookies
            );

            // Advance 1 second (should be ~10 polls)
            await jest.advanceTimersByTimeAsync(1000);

            // Let it finish
            await jest.advanceTimersByTimeAsync(5000);
            await promise;

            // Should have polled roughly 50 times (5 seconds / 100ms)
            expect(mockRedisGet.mock.calls.length).toBeGreaterThanOrEqual(45);
            expect(mockRedisGet.mock.calls.length).toBeLessThanOrEqual(55);
        });
    });
});
