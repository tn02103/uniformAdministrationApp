/**
 * Unit Tests for Retry Request Metadata Validation
 * 
 * Tests the security validation logic for cached retry requests.
 * Validates refresh token hash, user agent, and IP address checks.
 */

import { handleRetryRequest } from './handleRetryRequest';
import { sha256Hex } from '../helper.tokens';
import { logSecurityAuditEntry } from '../helper';
import { LogDebugLevel } from '../LogDebugLeve.enum';
import type { CachedRefreshData } from './idempotency.redis';
import { 
    createMockUserAgent, 
    createSimpleMockCookies, 
    createMockCachedRefreshData 
} from '../__testHelpers__';

// Mock dependencies
jest.mock('../helper.tokens', () => ({
    sha256Hex: jest.fn(),
}));

jest.mock('../helper', () => ({
    logSecurityAuditEntry: jest.fn(),
}));

jest.mock('../config', () => ({
    AuthConfig: {
        refreshTokenCookie: 'test-refresh-token',
    },
}));

const mockSha256Hex = sha256Hex as jest.MockedFunction<typeof sha256Hex>;
const mockLogSecurityAuditEntry = logSecurityAuditEntry as jest.MockedFunction<typeof logSecurityAuditEntry>;

describe('handleRetryRequest - Metadata Validation', () => {
    const mockAgent = createMockUserAgent('chrome-desktop');
    const mockCookies = createSimpleMockCookies();
    const baseCachedData = createMockCachedRefreshData({
        oldRefreshTokenHash: 'correct-hash-123',
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockLogSecurityAuditEntry.mockResolvedValue(undefined);
    });

    describe('Token Hash Validation (CRITICAL)', () => {
        it('should return 403 and log CRITICAL when token hash does not match', async () => {
            mockSha256Hex.mockReturnValue('wrong-hash-456');

            const result = await handleRetryRequest(
                baseCachedData,
                '192.168.1.1',
                mockAgent,
                'wrong-token-value',
                mockCookies
            );

            expect(result).toEqual({ status: 403, message: 'Invalid retry request' });
            expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith({
                success: false,
                ipAddress: '192.168.1.1',
                details: expect.stringContaining('mismatched refresh token'),
                action: 'REFRESH_ACCESS_TOKEN',
                userAgent: mockAgent,
                debugLevel: LogDebugLevel.CRITICAL,
            });
            expect(mockCookies.__mockSet).not.toHaveBeenCalled();
        });

        it('should pass validation when token hash matches', async () => {
            mockSha256Hex.mockReturnValue('correct-hash-123');

            const result = await handleRetryRequest(
                baseCachedData,
                '192.168.1.1',
                mockAgent,
                'correct-token-value',
                mockCookies
            );

            expect(result).toEqual({ status: 200, message: 'Success' });
            expect(mockCookies.__mockSet).toHaveBeenCalled();
        });
    });

    describe('User Agent Validation (CRITICAL)', () => {
        it('should return 403 and log CRITICAL when User Agent does not match', async () => {
            mockSha256Hex.mockReturnValue('correct-hash-123');

            const differentAgent = createMockUserAgent('firefox-mobile');

            const result = await handleRetryRequest(
                baseCachedData,
                '192.168.1.1',
                differentAgent,
                'correct-token-value',
                mockCookies
            );

            expect(result).toEqual({ status: 403, message: 'Invalid retry request' });
            expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith({
                success: false,
                ipAddress: '192.168.1.1',
                details: expect.stringContaining('different User Agent'),
                action: 'REFRESH_ACCESS_TOKEN',
                userAgent: differentAgent,
                debugLevel: LogDebugLevel.CRITICAL,
            });
            expect(mockCookies.__mockSet).not.toHaveBeenCalled();
        });

        it('should pass validation when User Agent matches exactly', async () => {
            mockSha256Hex.mockReturnValue('correct-hash-123');

            const result = await handleRetryRequest(
                baseCachedData,
                '192.168.1.1',
                mockAgent,
                'correct-token-value',
                mockCookies
            );

            expect(result).toEqual({ status: 200, message: 'Success' });
        });
    });

    describe('IP Address Validation (WARNING)', () => {
        it('should ALLOW but log WARNING when IP address is different', async () => {
            mockSha256Hex.mockReturnValue('correct-hash-123');

            const result = await handleRetryRequest(
                baseCachedData,
                '10.0.0.50', // Different IP
                mockAgent,
                'correct-token-value',
                mockCookies
            );

            expect(result).toEqual({ status: 200, message: 'Success' });
            expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith({
                success: true,
                ipAddress: '10.0.0.50',
                details: expect.stringContaining('Original: 192.168.1.1, Current: 10.0.0.50'),
                action: 'REFRESH_ACCESS_TOKEN',
                userAgent: mockAgent,
                debugLevel: LogDebugLevel.WARNING,
            });
            expect(mockCookies.__mockSet).toHaveBeenCalled();
        });

        it('should not log when IP address matches', async () => {
            mockSha256Hex.mockReturnValue('correct-hash-123');

            await handleRetryRequest(
                baseCachedData,
                '192.168.1.1', // Same IP
                mockAgent,
                'correct-token-value',
                mockCookies
            );

            // Should only log once (or not at all for IP check)
            expect(mockLogSecurityAuditEntry).not.toHaveBeenCalled();
        });
    });

    describe('Cookie Setting', () => {
        it('should set cookie with correct plaintext token from metadata', async () => {
            mockSha256Hex.mockReturnValue('correct-hash-123');

            await handleRetryRequest(
                baseCachedData,
                '192.168.1.1',
                mockAgent,
                'correct-token-value',
                mockCookies
            );

            expect(mockCookies.__mockSet).toHaveBeenCalledWith(
                'test-refresh-token',
                'new-token-plaintext-abc',
                expect.objectContaining({
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    expires: baseCachedData.metadata.cookieExpiry,
                    path: '/api/auth/refresh',
                })
            );
        });

        it('should set cookie with all security flags', async () => {
            mockSha256Hex.mockReturnValue('correct-hash-123');

            await handleRetryRequest(
                baseCachedData,
                '192.168.1.1',
                mockAgent,
                'correct-token-value',
                mockCookies
            );

            const cookieOptions = mockCookies.__mockSet.mock.calls[0][2];
            expect(cookieOptions).toEqual({
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                expires: baseCachedData.metadata.cookieExpiry,
                path: '/api/auth/refresh',
            });
        });

        it('should NOT set cookie when validation fails', async () => {
            mockSha256Hex.mockReturnValue('wrong-hash');

            await handleRetryRequest(
                baseCachedData,
                '192.168.1.1',
                mockAgent,
                'wrong-token-value',
                mockCookies
            );

            expect(mockCookies.__mockSet).not.toHaveBeenCalled();
        });
    });

    describe('Combined Validation Scenarios', () => {
        it('should fail on first check (token) even if others would pass', async () => {
            mockSha256Hex.mockReturnValue('wrong-hash');

            const result = await handleRetryRequest(
                baseCachedData,
                '192.168.1.1', // Correct IP
                mockAgent,     // Correct UA
                'wrong-token',
                mockCookies
            );

            expect(result).toEqual({ status: 403, message: 'Invalid retry request' });
        });

        it('should fail on second check (UA) even if token matches', async () => {
            mockSha256Hex.mockReturnValue('correct-hash-123');

            const differentAgent = createMockUserAgent('safari-desktop');

            const result = await handleRetryRequest(
                baseCachedData,
                '192.168.1.1',
                differentAgent,
                'correct-token-value',
                mockCookies
            );

            expect(result).toEqual({ status: 403, message: 'Invalid retry request' });
        });

        it('should pass all checks and return cached response', async () => {
            mockSha256Hex.mockReturnValue('correct-hash-123');

            const result = await handleRetryRequest(
                baseCachedData,
                '192.168.1.1',
                mockAgent,
                'correct-token-value',
                mockCookies
            );

            expect(result).toEqual({ status: 200, message: 'Success' });
            expect(mockCookies.__mockSet).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should handle malformed cached user agent gracefully', async () => {
            mockSha256Hex.mockReturnValue('correct-hash-123');

            const malformedData = {
                ...baseCachedData,
                metadata: {
                    ...baseCachedData.metadata,
                    userAgent: 'not-valid-json', // Will cause JSON.parse to fail
                }
            };

            await expect(handleRetryRequest(
                malformedData,
                '192.168.1.1',
                mockAgent,
                'correct-token-value',
                mockCookies
            )).rejects.toThrow();
        });

        it('should handle empty metadata gracefully', async () => {
            mockSha256Hex.mockReturnValue('');

            const emptyData: CachedRefreshData = {
                response: { status: 200, message: 'Success' },
                metadata: {
                    ipAddress: '',
                    userAgent: '{}',
                    oldRefreshTokenHash: '',
                    cookieExpiry: new Date(),
                    newRefreshTokenPlaintext: '',
                }
            };

            const result = await handleRetryRequest(
                emptyData,
                '192.168.1.1',
                mockAgent,
                'any-token',
                mockCookies
            );

            expect(result).toEqual({ status: 403, message: 'Invalid retry request' });
        });
    });
});
