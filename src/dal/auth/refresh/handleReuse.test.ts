/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit Tests for handleRefreshTokenReuse
 * 
 * Tests the graduated response strategy for refresh token reuse detection:
 * - Precondition validation (usedAt, usedIpAddress, usedUserAgent required)
 * - Scenario 1: Network retry (Redis unavailable, LOW risk, same IP, <100ms)
 * - Scenario 2: Different IP attack (definite attack - revoke all device sessions)
 * - Scenario 3: Device fingerprint mismatch (likely attack - revoke all device sessions)
 * - Scenario 4: Suspicious timing (revoke token family only)
 */

import { AuthenticationException } from '@/errors/Authentication';
import { sendTokenReuseDetectedEmail } from '@/lib/email/tokenReuseDetected';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';
import { LogDebugLevel } from '../LogDebugLeve.enum';
import { createMockAuthExceptionData, createMockUserAgent } from '../__testHelpers__';
import { RiskLevel, validateDeviceFingerprint } from '../helper';
import { isRedisAvailable } from '../redis';
import { handleRefreshTokenReuse } from './handleReuse';
import { DBRefreshToken } from './refreshAccessToken';

// Mock dependencies
jest.mock('../helper', () => ({
    validateDeviceFingerprint: jest.fn(),
    RiskLevel: {
        LOW: 0,
        MEDIUM: 1,
        HIGH: 2,
        SEVERE: 3,
    },
}));

jest.mock('../redis', () => ({
    isRedisAvailable: jest.fn(),
}));

jest.mock('@/lib/email/tokenReuseDetected', () => ({
    sendTokenReuseDetectedEmail: jest.fn(),
}));

const mockValidateDeviceFingerprint = validateDeviceFingerprint as jest.MockedFunction<typeof validateDeviceFingerprint>;
const mockIsRedisAvailable = isRedisAvailable as jest.MockedFunction<typeof isRedisAvailable>;
const mockSendTokenReuseDetectedEmail = sendTokenReuseDetectedEmail as jest.MockedFunction<typeof sendTokenReuseDetectedEmail>;
const mockPrisma = jest.requireMock('@/lib/db').prisma as DeepMockProxy<PrismaClient>;

describe('handleRefreshTokenReuse - Unit Tests', () => {
    const mockAgent = createMockUserAgent('chrome-desktop');
    const mockLogData = createMockAuthExceptionData();
    const currentTime = new Date('2024-01-15T12:00:00.000Z');

    // Helper to create mock token
    const createMockToken = (overrides?: Partial<DBRefreshToken>): any => ({
        id: 'token-id-123',
        token: 'hashed-token',
        status: 'active' as const,
        userId: 'user-id-123',
        deviceId: 'device-id-123',
        sessionId: 'session-id-123',
        tokenFamilyId: 'family-id-123',
        issuedAt: new Date('2024-01-15T11:50:00.000Z'),
        endOfLife: new Date('2024-01-22T12:00:00.000Z'),
        issuerIpAddress: '192.168.1.1',
        usedAt: new Date('2024-01-15T11:59:59.950Z'), // 50ms ago
        usedIpAddress: '192.168.1.1',
        usedUserAgent: JSON.stringify(mockAgent),
        ...overrides,
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Use fake timers and set system time
        jest.useFakeTimers();
        jest.setSystemTime(currentTime);

        // Default mock implementations
        mockValidateDeviceFingerprint.mockResolvedValue({
            riskLevel: RiskLevel.LOW,
            reasons: [],
        });
        mockIsRedisAvailable.mockReturnValue(true);
        mockSendTokenReuseDetectedEmail.mockResolvedValue(undefined);
        mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 } as any);
        mockPrisma.session.updateMany.mockResolvedValue({ count: 1 } as any);
    });

    afterEach(() => {
        // Restore real timers
        jest.useRealTimers();
    });

    describe('Precondition Validation', () => {
        it('should throw CRITICAL error when usedAt is missing', async () => {
            const token = createMockToken({ usedAt: null });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow(AuthenticationException);

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                exceptionType: 'AuthenticationFailed',
                debugLevel: LogDebugLevel.CRITICAL,
                message: expect.stringContaining('no previous usage data found'),
            });
        });

        it('should throw CRITICAL error when usedIpAddress is missing', async () => {
            const token = createMockToken({ usedIpAddress: null });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow(AuthenticationException);

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                debugLevel: LogDebugLevel.CRITICAL,
            });
        });

        it('should throw CRITICAL error when usedUserAgent is missing', async () => {
            const token = createMockToken({ usedUserAgent: null });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow(AuthenticationException);

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                debugLevel: LogDebugLevel.CRITICAL,
            });
        });
    });

    describe('Scenario 1: Network Retry (Redis Unavailable)', () => {
        beforeEach(() => {
            mockIsRedisAvailable.mockReturnValue(false);
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.LOW,
                reasons: [],
            });
        });

        it('should handle valid network retry (<100ms, same IP, LOW risk, no Redis)', async () => {
            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.950Z'), // 50ms ago
                usedIpAddress: '192.168.1.1',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow(AuthenticationException);

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                exceptionType: 'AuthenticationFailed',
                debugLevel: LogDebugLevel.WARNING,
                message: expect.stringContaining('possible network retry'),
            });

            // Should send email to developers only
            expect(mockSendTokenReuseDetectedEmail).toHaveBeenCalledWith('user-id-123', false);

            // Should NOT revoke any tokens or sessions
            expect(mockPrisma.refreshToken.updateMany).not.toHaveBeenCalled();
            expect(mockPrisma.session.updateMany).not.toHaveBeenCalled();
        });

        it('should NOT trigger Scenario 1 when timing is exactly 100ms', async () => {
            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.900Z'), // exactly 100ms ago
                usedIpAddress: '192.168.1.1',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow(AuthenticationException);

            // Should go to Scenario 4, not Scenario 1
            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                exceptionType: 'RefreshTokenReuseDetected',
                debugLevel: LogDebugLevel.CRITICAL,
                message: expect.stringContaining('Token family revoked'),
            });
        });

        it('should NOT trigger Scenario 1 when Redis is available', async () => {
            mockIsRedisAvailable.mockReturnValue(true);

            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.950Z'), // 50ms ago
                usedIpAddress: '192.168.1.1',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            // Should go to Scenario 4
            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Token family revoked'),
                debugLevel: LogDebugLevel.CRITICAL,
            });
        });

        it('should NOT trigger Scenario 1 with MEDIUM risk fingerprint', async () => {
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.MEDIUM,
                reasons: ['User agent mismatch'],
            });

            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.950Z'),
                usedIpAddress: '192.168.1.1',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            // Should go to Scenario 3
            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Device fingerprint mismatch'),
                debugLevel: LogDebugLevel.CRITICAL,
            });
        });

        it('should NOT trigger Scenario 1 with different IP (goes to Scenario 2)', async () => {
            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.950Z'),
                usedIpAddress: '192.168.1.1',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.100', // Different IP
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            // Should go to Scenario 2
            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.100',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Different IP address'),
                debugLevel: LogDebugLevel.CRITICAL,
            });
        });

        it('should trigger Scenario 1 at 99ms boundary', async () => {
            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.901Z'), // 99ms ago
                usedIpAddress: '192.168.1.1',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('possible network retry'),
                debugLevel: LogDebugLevel.WARNING,
            });
        });

        it('should NOT trigger Scenario 1 at 101ms (goes to Scenario 4)', async () => {
            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.899Z'), // 101ms ago
                usedIpAddress: '192.168.1.1',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Token family revoked'),
                debugLevel: LogDebugLevel.CRITICAL,
            });
        });
    });

    describe('Scenario 2: Different IP Attack', () => {
        it('should revoke all device sessions when IP changes', async () => {
            const token = createMockToken({
                usedIpAddress: '192.168.1.1',
                deviceId: 'device-123',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '10.0.0.1', // Different IP
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow(AuthenticationException);

            // Should revoke ALL tokens for this device
            expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
                where: { deviceId: 'device-123', status: 'active' },
                data: { status: 'revoked' },
            });

            // Should invalidate ALL sessions for this device
            expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
                where: { deviceId: 'device-123', valid: true },
                data: { valid: false },
            });
        });

        it('should send email to both user and developers on IP change', async () => {
            const token = createMockToken({
                usedIpAddress: '192.168.1.1',
                userId: 'user-456',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '10.0.0.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            expect(mockSendTokenReuseDetectedEmail).toHaveBeenCalledWith('user-456', true);
        });

        it('should throw RefreshTokenReuseDetected with CRITICAL level', async () => {
            const token = createMockToken({
                usedIpAddress: '192.168.1.1',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '10.0.0.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toBeInstanceOf(AuthenticationException);

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '10.0.0.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                exceptionType: 'RefreshTokenReuseDetected',
                debugLevel: LogDebugLevel.CRITICAL,
                message: expect.stringContaining('Different IP address'),
            });
        });

        it('should prioritize IP check over fingerprint risk level', async () => {
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.LOW, // LOW risk but different IP
                reasons: [],
            });

            const token = createMockToken({
                usedIpAddress: '192.168.1.1',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '10.0.0.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Different IP address'),
            });

            expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled();
        });

        it('should prioritize IP check over timing (<100ms)', async () => {
            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.950Z'), // 50ms ago
                usedIpAddress: '192.168.1.1',
            });

            // Goes to Scenario 2, not Scenario 1
            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '10.0.0.1', // Different IP
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Different IP address'),
            });
        });

        it('should call validateDeviceFingerprint before IP check', async () => {
            const token = createMockToken({
                usedIpAddress: '192.168.1.1',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '10.0.0.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            expect(mockValidateDeviceFingerprint).toHaveBeenCalledWith({
                current: {
                    ipAddress: '10.0.0.1',
                    userAgent: mockAgent,
                    deviceId: token.deviceId,
                },
                expected: {
                    ipAddress: '192.168.1.1',
                    userAgent: token.usedUserAgent,
                    deviceId: token.deviceId,
                },
            });
        });
    });

    describe('Scenario 3: Device Fingerprint Mismatch', () => {
        it('should revoke all device sessions with MEDIUM risk', async () => {
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.MEDIUM,
                reasons: ['User agent mismatch'],
            });

            const token = createMockToken({
                usedIpAddress: '192.168.1.1',
                deviceId: 'device-789',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1', // Same IP
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
                where: { deviceId: 'device-789', status: 'active' },
                data: { status: 'revoked' },
            });

            expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
                where: { deviceId: 'device-789', valid: true },
                data: { valid: false },
            });
        });

        it('should revoke all device sessions with HIGH risk', async () => {
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.HIGH,
                reasons: ['Device ID mismatch', 'User agent mismatch'],
            });

            const token = createMockToken();

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled();
            expect(mockPrisma.session.updateMany).toHaveBeenCalled();
        });

        it('should revoke all device sessions with SEVERE risk', async () => {
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.SEVERE,
                reasons: ['Multiple mismatches'],
            });

            const token = createMockToken();

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled();
            expect(mockPrisma.session.updateMany).toHaveBeenCalled();
        });

        it('should NOT trigger Scenario 3 with LOW risk', async () => {
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.LOW,
                reasons: [],
            });

            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.000Z'), // 1000ms ago
            });

            // Should go to Scenario 4
            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Token family revoked'),
            });
        });

        it('should send email to both user and developers', async () => {
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.MEDIUM,
                reasons: [],
            });

            const token = createMockToken({ userId: 'user-999' });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            expect(mockSendTokenReuseDetectedEmail).toHaveBeenCalledWith('user-999', true);
        });

        it('should throw RefreshTokenReuseDetected with CRITICAL level', async () => {
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.MEDIUM,
                reasons: [],
            });

            const token = createMockToken();

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                exceptionType: 'RefreshTokenReuseDetected',
                debugLevel: LogDebugLevel.CRITICAL,
                message: expect.stringContaining('Device fingerprint mismatch'),
            });
        });

        it('should prioritize fingerprint over timing', async () => {
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.MEDIUM,
                reasons: [],
            });

            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.000Z'), // 1000ms ago (slow)
            });

            // Goes to Scenario 3, not Scenario 4
            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Device fingerprint mismatch'),
            });

            // Should revoke device, not just token family
            expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
                where: { deviceId: token.deviceId, status: 'active' },
                data: { status: 'revoked' },
            });
        });

        it('should handle boundary: exactly MEDIUM risk level (1)', async () => {
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: 1, // Exactly MEDIUM
                reasons: [],
            });

            const token = createMockToken();

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Device fingerprint mismatch'),
            });
        });
    });

    describe('Scenario 4: Suspicious Timing', () => {
        it('should revoke token family only (not entire device)', async () => {
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.LOW,
                reasons: [],
            });

            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.000Z'), // 1000ms ago
                usedIpAddress: '192.168.1.1',
                tokenFamilyId: 'family-xyz',
                deviceId: 'device-abc',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1', // Same IP
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            // Should revoke only the token family
            expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
                where: { tokenFamilyId: 'family-xyz', status: 'active' },
                data: { status: 'revoked' },
            });

            // Should NOT use deviceId in where clause
            expect(mockPrisma.refreshToken.updateMany).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ deviceId: 'device-abc' }),
                })
            );
        });

        it('should invalidate sessions in token family only', async () => {
            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.000Z'),
                usedIpAddress: '192.168.1.1',
                tokenFamilyId: 'family-xyz',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
                where: {
                    refreshTokens: { some: { tokenFamilyId: 'family-xyz' } },
                },
                data: { valid: false },
            });
        });

        it('should send email to developers only (not user)', async () => {
            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.000Z'),
                usedIpAddress: '192.168.1.1',
                userId: 'user-111',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            expect(mockSendTokenReuseDetectedEmail).toHaveBeenCalledWith('user-111', false);
        });

        it('should throw RefreshTokenReuseDetected with CRITICAL level', async () => {
            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.000Z'),
                usedIpAddress: '192.168.1.1',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                exceptionType: 'RefreshTokenReuseDetected',
                debugLevel: LogDebugLevel.CRITICAL,
                message: expect.stringContaining('Token family revoked'),
            });
        });

        it('should trigger at 101ms boundary', async () => {
            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.899Z'), // 101ms ago
                usedIpAddress: '192.168.1.1',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            // Should be Scenario 4
            expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ tokenFamilyId: expect.any(String) }),
                })
            );
        });

        it('should trigger with very slow reuse (1000ms)', async () => {
            const token = createMockToken({
                usedAt: new Date('2024-01-15T11:59:59.000Z'), // 1000ms ago
                usedIpAddress: '192.168.1.1',
            });

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            await expect(
                handleRefreshTokenReuse({
                    token,
                    ipAddress: '192.168.1.1',
                    agent: mockAgent,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Token family revoked'),
            });
        });
    });
});
