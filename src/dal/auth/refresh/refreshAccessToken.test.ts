/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit Tests for refreshToken (refreshAccessToken)
 * 
 * Tests the main Server Action for refresh token flow:
 * - Idempotency lock management (with and without Redis)
 * - Rate limiting
 * - Cookie and input validation
 * - Token verification orchestration
 * - Session lifetime calculation
 * - Token issuance
 * - Redis caching
 * - Error handling and session destruction
 */

import { AuthenticationException } from '@/errors/Authentication';
import dayjs from '@/lib/dayjs';
import { getIronSession } from '@/lib/ironSession';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';
import { cookies, headers } from 'next/headers';
import { userAgent } from 'next/server';
import { LogDebugLevel } from '../LogDebugLeve.enum';
import { createMockAuthExceptionData } from '../__testHelpers__';
import {
    authMockData,
    createMockDBToken,
    getCookieMockFactory,
    getDeviceAccountFromCookieReturnMock,
    getHeaderGetMockImplementation,
    getMockUserAgent,
    getNextHeaderMockFactory
} from '../__testHelpers__/mockData';
import { AuthConfig } from '../config';
import {
    calculateSessionLifetime, getDeviceAccountFromCookies,
    getIPAddress, logSecurityAuditEntry, RiskLevel
} from '../helper';
import {
    issueNewAccessToken,
    issueNewRefreshToken,
    sha256Hex,
} from '../helper.tokens';
import {
    releaseLock,
    storeCachedResult,
    tryAcquireLockWithPolling,
} from './idempotency.redis';
import { refreshToken, type DBRefreshToken } from './refreshAccessToken';
import { verifyRefreshToken } from './verifyRefreshToken';

// Mock all dependencies
jest.mock('./verifyRefreshToken');
jest.mock('./idempotency.redis');
jest.mock('../helper');
jest.mock('../helper.tokens');
jest.mock('@/lib/ironSession');
jest.mock('next/headers', () => ({
    headers: jest.fn(),
    cookies: jest.fn(),
}));
jest.mock('next/server', () => ({
    userAgent: jest.fn(),
}));


const mockVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<typeof verifyRefreshToken>;
const mockTryAcquireLockWithPolling = tryAcquireLockWithPolling as jest.MockedFunction<typeof tryAcquireLockWithPolling>;
const mockStoreCachedResult = storeCachedResult as jest.MockedFunction<typeof storeCachedResult>;
const mockReleaseLock = releaseLock as jest.MockedFunction<typeof releaseLock>;
const mockCalculateSessionLifetime = calculateSessionLifetime as jest.MockedFunction<typeof calculateSessionLifetime>;
const mockLogSecurityAuditEntry = logSecurityAuditEntry as jest.MockedFunction<typeof logSecurityAuditEntry>;
const mockGetDeviceAccountFromCookies = getDeviceAccountFromCookies as jest.MockedFunction<typeof getDeviceAccountFromCookies>;
const mockGetIPAddress = getIPAddress as jest.MockedFunction<typeof getIPAddress>;
const mockIssueNewAccessToken = issueNewAccessToken as jest.MockedFunction<typeof issueNewAccessToken>;
const mockIssueNewRefreshToken = issueNewRefreshToken as jest.MockedFunction<typeof issueNewRefreshToken>;
const mockSha256Hex = sha256Hex as jest.MockedFunction<typeof sha256Hex>;
const mockGetIronSession = getIronSession as jest.MockedFunction<typeof getIronSession>;
const mockHeaders = headers as jest.MockedFunction<typeof headers>;
const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockUserAgent = userAgent as jest.MockedFunction<typeof userAgent>;
const mockPrisma = jest.requireMock('@/lib/db').prisma as DeepMockProxy<PrismaClient>;

describe('refreshToken - Unit Tests', () => {
    const mockAgent = getMockUserAgent()
    const mockLogData = createMockAuthExceptionData();
    const testDBTokenEntity = createMockDBToken({ token: 'hashed-token-xyz' });


    const { cookieFactory, mockCookieInstance } = getCookieMockFactory({
        deviceId: testDBTokenEntity.device.id as string,
        organisationId: testDBTokenEntity.user.organisationId,
        refreshToken: 'refresh-token-xyz',
    });
    const { headerFactory, mockHeaderInstance } = getNextHeaderMockFactory();

    // Mock session
    type IronSession = Awaited<ReturnType<typeof getIronSession>>;
    const mockSession: Partial<IronSession> = {
        destroy: jest.fn(),
        save: jest.fn(),
    };

    const { RateLimiterMemory } = jest.requireMock('rate-limiter-flexible');
    const rateLimiterInstance = RateLimiterMemory();

    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock implementations
        mockHeaders.mockResolvedValue(headerFactory());
        mockCookies.mockResolvedValue(cookieFactory());
        mockUserAgent.mockReturnValue(mockAgent);
        mockGetIPAddress.mockReturnValue(authMockData.ipAddress);
        mockGetDeviceAccountFromCookies.mockReturnValue(getDeviceAccountFromCookieReturnMock());
        mockGetIronSession.mockResolvedValue(mockSession as IronSession);
        mockLogSecurityAuditEntry.mockResolvedValue(undefined);
        mockVerifyRefreshToken.mockResolvedValue({
            riskLevel: RiskLevel.LOW,
            reasons: [],
        });
        mockCalculateSessionLifetime.mockReturnValue(dayjs().add(7, 'days').toDate());
        mockIssueNewRefreshToken.mockResolvedValue('new-refresh-token-xyz');
        mockIssueNewAccessToken.mockResolvedValue(undefined);
        mockSha256Hex.mockReturnValue(testDBTokenEntity.token);
        mockStoreCachedResult.mockResolvedValue(undefined);
        mockReleaseLock.mockResolvedValue(undefined);
        mockPrisma.refreshToken.findFirst.mockResolvedValue(testDBTokenEntity);
        mockTryAcquireLockWithPolling.mockResolvedValue({ lockAcquired: true });
        rateLimiterInstance.get.mockResolvedValue(({
            remainingPoints: 10,
        }));
    });

    describe('Precondition Checks', () => {
        it('should return 400 when IP address is missing', async () => {
            mockGetIPAddress.mockReturnValue(null as unknown as string);

            const result = await refreshToken();

            expect(result).toEqual({
                status: 400,
                message: 'IP Address is required',
            });
        });

        it('should return 429 when IP is rate limited', async () => {
            rateLimiterInstance.get.mockResolvedValue(({
                remainingPoints: 0,
            }));
            const result = await refreshToken();

            expect(rateLimiterInstance.get).toHaveBeenCalled();
            expect(result).toStrictEqual({
                status: 429,
                message: 'Too many requests. Try again later.',
            });
        });
    });

    describe('Idempotency Lock Behavior', () => {

        it('should process normally without idempotency key', async () => {
            mockHeaderInstance.get.mockImplementation(getHeaderGetMockImplementation({ idempotencyKey: null }));

            const result = await refreshToken();

            expect(result).toEqual({
                status: 200,
                message: 'Tokens refreshed successfully',
            });
            expect(mockTryAcquireLockWithPolling).not.toHaveBeenCalled();
            expect(mockStoreCachedResult).not.toHaveBeenCalled();
            expect(mockReleaseLock).not.toHaveBeenCalled();
        });

        it('should acquire lock and process when lock is available', async () => {
            mockTryAcquireLockWithPolling.mockResolvedValue({
                lockAcquired: true,
            });

            const result = await refreshToken();

            expect(result).toEqual({
                status: 200,
                message: 'Tokens refreshed successfully',
            });
            expect(mockTryAcquireLockWithPolling).toHaveBeenCalledWith(
                authMockData.idempotencyKey,
                authMockData.ipAddress,
                mockAgent,
                authMockData.refreshToken,
                mockCookieInstance
            );
            expect(mockStoreCachedResult).toHaveBeenCalled();
            expect(mockReleaseLock).toHaveBeenCalledWith(authMockData.idempotencyKey);
        });

        it('should return cached response when lock is not acquired', async () => {
            mockTryAcquireLockWithPolling.mockResolvedValue({
                lockAcquired: false,
                cachedResponse: {
                    status: 200,
                    message: 'Cached response',
                },
            });

            const result = await refreshToken();

            expect(result).toEqual({
                status: 200,
                message: 'Cached response',
            });
            expect(mockVerifyRefreshToken).not.toHaveBeenCalled();
            expect(mockStoreCachedResult).not.toHaveBeenCalled();
        });

        it('should release lock on successful completion', async () => {
            mockTryAcquireLockWithPolling.mockResolvedValue({
                lockAcquired: true,
            });

            await refreshToken();

            expect(mockReleaseLock).toHaveBeenCalledWith(authMockData.idempotencyKey);
        });

        it('should release lock on error', async () => {
            mockTryAcquireLockWithPolling.mockResolvedValue({
                lockAcquired: true,
            });
            mockVerifyRefreshToken.mockRejectedValue(
                new AuthenticationException(
                    'Token invalid',
                    'AuthenticationFailed',
                    LogDebugLevel.WARNING,
                    mockLogData
                )
            );

            await refreshToken();

            expect(mockReleaseLock).toHaveBeenCalledWith(authMockData.idempotencyKey);
        });
    });

    describe('Cookie & Token Validation', () => {
        it('should throw exception when refresh token cookie is missing', async () => {
            mockCookies.mockResolvedValue(cookieFactory({ refreshToken: null }));

            const result = await refreshToken();
            expect(result).toEqual({
                status: 401,
                message: 'Authentication failed',
            });
            expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    details: 'Refresh token cookie is missing',
                })
            );
        });

        it('should throw exception when account cookie is missing', async () => {
            mockGetDeviceAccountFromCookies.mockReturnValue({
                account: null,
                accountCookie: null,
            });

            const result = await refreshToken();

            expect(result).toEqual({
                status: 401,
                message: 'Authentication failed',
            });
            expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    details: 'Account from AccountCookie is missing',
                })
            );
        });

        it('should throw exception when DB token not found', async () => {
            mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

            const result = await refreshToken();

            expect(result).toEqual({
                status: 401,
                message: 'Authentication failed',
            });
            expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    details: 'Refresh token not found in database',
                })
            );
        });

        it('should call prisma.refreshToken.findFirst with correct parameters', async () => {
            await refreshToken();

            expect(mockPrisma.refreshToken.findFirst).toHaveBeenCalledWith({
                where: {
                    deviceId: 'device-id-123',
                    status: 'active',
                },
                include: {
                    user: {
                        include: {
                            organisation: true,
                        },
                    },
                    device: true,
                    session: true,
                },
            });
        });
    });

    describe('Token Verification', () => {
        it('should call verifyRefreshToken with correct parameters', async () => {
            await refreshToken();

            expect(mockVerifyRefreshToken).toHaveBeenCalledWith({
                dbToken: expect.objectContaining({
                    id: authMockData.refreshTokenId,
                    deviceId: authMockData.deviceId,
                }),
                agent: mockAgent,
                ipAddress: authMockData.ipAddress,
                sendToken: authMockData.refreshToken,
                cookieList: mockCookieInstance,
                account: expect.objectContaining({
                    deviceId: authMockData.deviceId,
                    organisationId: authMockData.organisationId,
                }),
                logData: expect.objectContaining({
                    ipAddress: authMockData.ipAddress,
                    userAgent: mockAgent,
                }),
            });
        });

        it('should handle verifyRefreshToken exception and return 401', async () => {
            mockVerifyRefreshToken.mockRejectedValue(
                new AuthenticationException(
                    'Token expired',
                    'AuthenticationFailed',
                    LogDebugLevel.INFO,
                    mockLogData
                )
            );

            const result = await refreshToken();

            expect(result).toEqual({
                status: 401,
                message: 'Authentication failed',
            });
            expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    details: 'Token expired',
                    action: 'REFRESH_ACCESS_TOKEN',
                })
            );
        });
    });

    describe('Session Lifetime Calculation', () => {
        it('should call calculateSessionLifetime with correct parameters', async () => {
            const dbToken = createMockDBToken();
            mockPrisma.refreshToken.findFirst.mockResolvedValue(dbToken);

            await refreshToken();

            expect(mockCalculateSessionLifetime).toHaveBeenCalledWith({
                lastPWValidation: dbToken.session.lastLoginAt,
                mfa: {
                    lastValidation: dbToken.device.lastMFAAt,
                    type: dbToken.device.lastUsedMFAType,
                },
                fingerprintRisk: RiskLevel.LOW,
                userRole: dbToken.user.role,
                isNewDevice: false,
            });
        });

        it('should handle calculateSessionLifetime with no MFA', async () => {
            const dbToken = createMockDBToken({
                token: "hashed-token-xyz",
                device: {
                    id: authMockData.deviceId,
                    lastMFAAt: null,
                    lastUsedMFAType: null,
                },
            });
            mockPrisma.refreshToken.findFirst.mockResolvedValue(dbToken as any);
            await refreshToken();
            expect(mockCalculateSessionLifetime).toHaveBeenCalledWith({
                lastPWValidation: dbToken.session.lastLoginAt,
                mfa: undefined,
                fingerprintRisk: RiskLevel.LOW,
                userRole: dbToken.user.role,
                isNewDevice: false,
            });
        });

        it('should throw exception when EOL is null (password re-auth required)', async () => {
            mockCalculateSessionLifetime.mockReturnValue(null);

            const result = await refreshToken();

            expect(result).toEqual({
                status: 401,
                message: 'Authentication failed',
            });
            expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    details: expect.stringContaining('password re-authentication required'),
                })
            );
        });

        it('should throw exception for inactive session with insufficient EOL', async () => {
            const dbToken = createMockDBToken({
                token: "hashed-token-xyz",
                issuedAt: dayjs().subtract(AuthConfig.inactiveCutoff + 10, 'minutes').toDate(),
            });
            mockPrisma.refreshToken.findFirst.mockResolvedValue(dbToken as unknown as DBRefreshToken);
            mockCalculateSessionLifetime.mockReturnValue(
                dayjs().add(1, 'hour').toDate() // Less than inactiveRefreshMinAge (120 minutes)
            );

            const result = await refreshToken();

            expect(result).toEqual({
                status: 401,
                message: 'Authentication failed',
            });
            expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    details: expect.stringContaining('Inactive Session'),
                })
            );
        });

        it('should pass for inactive session with sufficient EOL', async () => {
            const dbToken = createMockDBToken({
                token: "hashed-token-xyz",
                issuedAt: dayjs().subtract(AuthConfig.inactiveCutoff + 10, 'minutes').toDate(),
            });
            mockPrisma.refreshToken.findFirst.mockResolvedValue(dbToken as any);
            mockCalculateSessionLifetime.mockReturnValue(
                dayjs().add(AuthConfig.inactiveRefreshMinAge + 10, 'minutes').toDate()
            );

            const result = await refreshToken();

            expect(result).toEqual({
                status: 200,
                message: 'Tokens refreshed successfully',
            });
        });

        it('should pass for active session (recent issuedAt)', async () => {
            const dbToken = createMockDBToken({
                token: "hashed-token-xyz",
                issuedAt: dayjs().subtract(10, 'minutes').toDate(),
            });
            mockPrisma.refreshToken.findFirst.mockResolvedValue(dbToken as any);

            const result = await refreshToken();

            expect(result).toEqual({
                status: 200,
                message: 'Tokens refreshed successfully',
            });
        });
    });

    describe('Token Issuance', () => {
        it('should call issueNewRefreshToken with mode="refresh"', async () => {
            const dbToken = createMockDBToken();
            mockPrisma.refreshToken.findFirst.mockResolvedValue(dbToken);
            const calculatedEOL = dayjs().add(7, 'days').toDate();
            mockCalculateSessionLifetime.mockReturnValue(calculatedEOL);

            await refreshToken();

            expect(mockIssueNewRefreshToken).toHaveBeenCalledWith({
                cookieList: mockCookieInstance,
                userId: 'user-id-123',
                usedRefreshTokenId: 'token-id-123',
                deviceId: 'device-id-123',
                ipAddress: '192.168.1.1',
                endOfLife: calculatedEOL,
                userAgent: mockAgent,
                logData: expect.any(Object),
                mode: 'refresh',
                sessionId: 'session-id-123',
            });
        });

        it('should call issueNewAccessToken with correct parameters', async () => {
            const dbToken = createMockDBToken();
            mockPrisma.refreshToken.findFirst.mockResolvedValue(dbToken);

            await refreshToken();

            expect(mockIssueNewAccessToken).toHaveBeenCalledWith({
                ironSession: mockSession,
                user: expect.objectContaining({
                    id: 'user-id-123',
                    organisationId: 'org-id-123',
                }),
                organisation: expect.objectContaining({
                    id: 'org-id-123',
                }),
                sessionId: 'session-id-123',
            });
        });

        it('should return 200 status on successful token issuance', async () => {
            const result = await refreshToken();

            expect(result).toEqual({
                status: 200,
                message: 'Tokens refreshed successfully',
            });
        });

        it('should log security audit entry on success', async () => {
            await refreshToken();

            expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith({
                userId: 'user-id-123',
                organisationId: 'org-id-123',
                success: true,
                ipAddress: '192.168.1.1',
                details: 'Refresh token valid',
                action: 'REFRESH_ACCESS_TOKEN',
                userAgent: mockAgent,
                deviceId: 'device-id-123',
                debugLevel: LogDebugLevel.SUCCESS,
            });
        });
    });

    describe('Redis Caching', () => {
        beforeEach(() => {
            mockTryAcquireLockWithPolling.mockResolvedValue({
                lockAcquired: true,
            });
        });

        it('should store cached result with complete metadata', async () => {
            const calculatedEOL = dayjs().add(7, 'days').toDate();
            mockCalculateSessionLifetime.mockReturnValue(calculatedEOL);
            mockIssueNewRefreshToken.mockResolvedValue('new-refresh-token-xyz');
            mockSha256Hex.mockReturnValue('hashed-old-token');

            await refreshToken();

            expect(mockStoreCachedResult).toHaveBeenCalledWith(
                authMockData.idempotencyKey,
                {
                    response: {
                        status: 200,
                        message: 'Tokens refreshed successfully',
                    },
                    metadata: {
                        ipAddress: authMockData.ipAddress,
                        userAgent: JSON.stringify(mockAgent),
                        oldRefreshTokenHash: 'hashed-old-token',
                        cookieExpiry: calculatedEOL,
                        newRefreshTokenPlaintext: 'new-refresh-token-xyz',
                    },
                }
            );
        });

        it('should call sha256Hex with refresh token cookie value', async () => {
            await refreshToken();

            expect(mockSha256Hex).toHaveBeenCalledWith(authMockData.refreshToken);
        });

        it('should not cache when no idempotency key', async () => {
            mockHeaderInstance.get.mockImplementation(
                getHeaderGetMockImplementation({ idempotencyKey: null })
            );

            await refreshToken();

            expect(mockStoreCachedResult).not.toHaveBeenCalled();
        });

        it('should not cache when lock was not acquired', async () => {
            mockTryAcquireLockWithPolling.mockResolvedValue({
                lockAcquired: false,
                cachedResponse: {
                    status: 200,
                    message: 'Cached',
                },
            });

            await refreshToken();

            expect(mockStoreCachedResult).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling & Session Destruction', () => {
        it('should destroy session for AuthenticationFailed exception', async () => {
            mockVerifyRefreshToken.mockRejectedValue(
                new AuthenticationException(
                    'Token invalid',
                    'AuthenticationFailed',
                    LogDebugLevel.WARNING,
                    mockLogData
                )
            );

            await refreshToken();

            expect(mockSession.destroy).toHaveBeenCalled();
        });

        it('should return 401 for AuthenticationFailed', async () => {
            mockVerifyRefreshToken.mockRejectedValue(
                new AuthenticationException(
                    'Token invalid',
                    'AuthenticationFailed',
                    LogDebugLevel.WARNING,
                    mockLogData
                )
            );

            const result = await refreshToken();

            expect(result).toEqual({
                status: 401,
                message: 'Authentication failed',
            });
        });

        it('should destroy session for CRITICAL RefreshTokenReuseDetected', async () => {
            mockVerifyRefreshToken.mockRejectedValue(
                new AuthenticationException(
                    'Token reuse detected',
                    'RefreshTokenReuseDetected',
                    LogDebugLevel.CRITICAL,
                    mockLogData
                )
            );

            await refreshToken();

            expect(mockSession.destroy).toHaveBeenCalled();
        });

        it('should NOT destroy session for non-CRITICAL RefreshTokenReuseDetected', async () => {
            mockVerifyRefreshToken.mockRejectedValue(
                new AuthenticationException(
                    'Token reuse detected',
                    'RefreshTokenReuseDetected',
                    LogDebugLevel.WARNING,
                    mockLogData
                )
            );

            await refreshToken();

            expect(mockSession.destroy).not.toHaveBeenCalled();
        });

        it('should return 500 for RefreshTokenReuseDetected', async () => {
            mockVerifyRefreshToken.mockRejectedValue(
                new AuthenticationException(
                    'Token reuse detected',
                    'RefreshTokenReuseDetected',
                    LogDebugLevel.CRITICAL,
                    mockLogData
                )
            );

            const result = await refreshToken();

            expect(result).toEqual({
                status: 500,
                message: 'An unknown error occurred',
            });
        });

        it('should return 500 for unknown AuthenticationException type', async () => {
            mockVerifyRefreshToken.mockRejectedValue(
                new AuthenticationException(
                    'Unknown error',
                    'UnknownError',
                    LogDebugLevel.WARNING,
                    mockLogData
                )
            );

            const result = await refreshToken();

            expect(result).toEqual({
                status: 500,
                message: 'An unknown error occurred',
            });
        });

        it('should return 500 for non-AuthenticationException errors', async () => {
            mockVerifyRefreshToken.mockRejectedValue(new Error('Unexpected error'));

            const result = await refreshToken();

            expect(result).toEqual({
                status: 500,
                message: 'Unknown error occurred',
            });
        });

        it('should log security audit for all AuthenticationException errors', async () => {
            mockVerifyRefreshToken.mockRejectedValue(
                new AuthenticationException(
                    'Custom error',
                    'AuthenticationFailed',
                    LogDebugLevel.WARNING,
                    mockLogData
                )
            );

            await refreshToken();

            expect(mockLogSecurityAuditEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    details: 'Custom error',
                    action: 'REFRESH_ACCESS_TOKEN',
                    debugLevel: LogDebugLevel.WARNING,
                })
            );
        });
    });

    describe('Complete Happy Path', () => {
        it('should complete full refresh flow with correct call order', async () => {
            const callOrder: string[] = [];

            mockGetIPAddress.mockImplementation(() => {
                callOrder.push('getIPAddress');
                return '192.168.1.1';
            });
            mockPrisma.refreshToken.findFirst.mockImplementation((async () => {
                callOrder.push('findToken');
                return createMockDBToken();
            }) as () => any);
            mockVerifyRefreshToken.mockImplementation(async () => {
                callOrder.push('verifyToken');
                return { riskLevel: RiskLevel.LOW, reasons: [] };
            });
            mockCalculateSessionLifetime.mockImplementation(() => {
                callOrder.push('calculateLifetime');
                return dayjs().add(7, 'days').toDate();
            });
            mockIssueNewRefreshToken.mockImplementation(async () => {
                callOrder.push('issueRefreshToken');
                return 'new-token';
            });
            mockIssueNewAccessToken.mockImplementation(async () => {
                callOrder.push('issueAccessToken');
                return undefined;
            });

            await refreshToken();

            expect(callOrder).toEqual([
                'getIPAddress',
                'findToken',
                'verifyToken',
                'calculateLifetime',
                'issueRefreshToken',
                'issueAccessToken',
            ]);
        });

        it('should return 200 with success message on complete flow', async () => {
            const result = await refreshToken();

            expect(result).toEqual({
                status: 200,
                message: 'Tokens refreshed successfully',
            });
        });

        it('should call all required functions exactly once', async () => {
            await refreshToken();

            expect(mockGetIPAddress).toHaveBeenCalledTimes(1);
            expect(mockGetDeviceAccountFromCookies).toHaveBeenCalledTimes(1);
            expect(mockPrisma.refreshToken.findFirst).toHaveBeenCalledTimes(1);
            expect(mockVerifyRefreshToken).toHaveBeenCalledTimes(1);
            expect(mockCalculateSessionLifetime).toHaveBeenCalledTimes(1);
            expect(mockIssueNewRefreshToken).toHaveBeenCalledTimes(1);
            expect(mockIssueNewAccessToken).toHaveBeenCalledTimes(1);
        });
    });
});

