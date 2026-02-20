/**
 * Unit Tests for verifyRefreshToken
 * 
 * Tests all validation checks in the refresh token verification process:
 * - Token hash validation
 * - Token status checks (revoked, used, rotated)
 * - Session validity
 * - Token expiration (with inactive session handling)
 * - User status validation
 * - Organization ID matching
 * - Device fingerprint validation
 */

import { verifyRefreshToken } from './verifyRefreshToken';
import { AuthenticationException } from '@/errors/Authentication';
import { LogDebugLevel } from '../LogDebugLeve.enum';
import { RiskLevel } from '../helper';
import { sha256Hex } from '../helper.tokens';
import { handleRefreshTokenReuse } from './handleReuse';
import { validateDeviceFingerprint } from '../helper';
import { isValid } from 'date-fns';
import dayjs from 'dayjs';
import {
    createMockUserAgent,
    createSimpleMockCookies,
    createMockAuthExceptionData,
} from '../__testHelpers__';
import { AuthConfig } from '../config';
import { authMockData, createMockDBToken } from '../__testHelpers__/mockData';

// Mock dependencies
jest.mock('../helper.tokens', () => ({
    sha256Hex: jest.fn(),
}));

jest.mock('./handleReuse', () => ({
    handleRefreshTokenReuse: jest.fn(),
}));

jest.mock('../helper', () => ({
    validateDeviceFingerprint: jest.fn(),
    // Export RiskLevel enum so tests can use it
    RiskLevel: {
        LOW: 0,
        MEDIUM: 1,
        HIGH: 2,
        SEVERE: 3,
    },
}));

jest.mock('date-fns', () => ({
    isValid: jest.fn(),
}));

const mockSha256Hex = sha256Hex as jest.MockedFunction<typeof sha256Hex>;
const mockHandleRefreshTokenReuse = handleRefreshTokenReuse as jest.MockedFunction<typeof handleRefreshTokenReuse>;
const mockValidateDeviceFingerprint = validateDeviceFingerprint as jest.MockedFunction<typeof validateDeviceFingerprint>;
const mockIsValid = isValid as jest.MockedFunction<typeof isValid>;

describe('verifyRefreshToken - Unit Tests', () => {
    const mockAgent = createMockUserAgent('chrome-desktop');
    const mockCookies = createSimpleMockCookies();
    const mockLogData = createMockAuthExceptionData();

    const mockAccount = {
        deviceId: authMockData.deviceId,
        organisationId: authMockData.organisationId,
        lastUsedAt: dayjs().toISOString(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Default successful mocks
        mockSha256Hex.mockReturnValue(authMockData.refreshToken);
        mockIsValid.mockReturnValue(true);
        mockValidateDeviceFingerprint.mockResolvedValue({
            riskLevel: RiskLevel.LOW,
            reasons: [],
        });
    });

    describe('Token Hash Validation', () => {
        it('should throw CRITICAL exception when token hash does not match', async () => {
            const dbToken = createMockDBToken({ token: 'different-hash-xyz' });
            mockSha256Hex.mockReturnValue('sent-token-hash');

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: authMockData.refreshToken,
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toThrow(AuthenticationException);

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: authMockData.refreshToken,
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: 'Refresh token hash does not match',
                exceptionType: 'AuthenticationFailed',
                debugLevel: LogDebugLevel.WARNING,
            });
        });

        it('should pass validation when token hash matches', async () => {
            const dbToken = createMockDBToken({ token: 'correct-hash-abc' });
            mockSha256Hex.mockReturnValue('correct-hash-abc');

            const result = await verifyRefreshToken({
                dbToken,
                agent: mockAgent,
                ipAddress: authMockData.ipAddress,
                sendToken: authMockData.refreshToken,
                cookieList: mockCookies,
                account: mockAccount,
                logData: mockLogData,
            });

            expect(result).toEqual({
                riskLevel: RiskLevel.LOW,
                reasons: [],
            });
        });
    });

    describe('Token Status Validation', () => {
        it('should throw CRITICAL exception when token is revoked', async () => {
            const dbToken = createMockDBToken({ status: 'revoked' });

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: authMockData.refreshToken,
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                exceptionType: 'AuthenticationFailed',
                debugLevel: LogDebugLevel.CRITICAL,
                message: "Refresh token has been revoked",
            });
        });

        it('should call handleRefreshTokenReuse when token has usedAt timestamp', async () => {
            const dbToken = createMockDBToken({
                usedAt: dayjs().subtract(1, 'second').toDate(),
                usedIpAddress: authMockData.ipAddress,
                usedUserAgent: JSON.stringify(mockAgent),
            });
            mockHandleRefreshTokenReuse.mockImplementation(() => {
                throw new AuthenticationException(
                    'Token reuse detected',
                    'RefreshTokenReuseDetected',
                    LogDebugLevel.CRITICAL,
                    mockLogData
                );
            });

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                exceptionType: 'RefreshTokenReuseDetected',
            });

            expect(mockHandleRefreshTokenReuse).toHaveBeenCalledWith({
                token: dbToken,
                ipAddress: authMockData.ipAddress,
                agent: mockAgent,
                logData: mockLogData,
            });
        });

        it('should call handleRefreshTokenReuse when token status is rotated', async () => {
            const dbToken = createMockDBToken({
                status: 'rotated',
                usedAt: dayjs().subtract(1, 'second').toDate(),
                usedIpAddress: authMockData.ipAddress,
                usedUserAgent: JSON.stringify(mockAgent),
            });
            mockHandleRefreshTokenReuse.mockImplementation(() => {
                throw new AuthenticationException(
                    'Token reuse detected',
                    'RefreshTokenReuseDetected',
                    LogDebugLevel.CRITICAL,
                    mockLogData
                );
            });

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            expect(mockHandleRefreshTokenReuse).toHaveBeenCalled();
        });
    });

    describe('Session Validity', () => {
        it('should throw WARNING exception when session is not valid', async () => {
            const dbToken = createMockDBToken({
                session: { valid: false },
            });

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: 'Session is no longer valid',
                exceptionType: 'AuthenticationFailed',
                debugLevel: LogDebugLevel.WARNING,
            });
        });

        it('should pass when session is valid', async () => {
            const dbToken = createMockDBToken({
                session: { valid: true },
            });

            const result = await verifyRefreshToken({
                dbToken,
                agent: mockAgent,
                ipAddress: authMockData.ipAddress,
                sendToken: 'sent-token',
                cookieList: mockCookies,
                account: mockAccount,
                logData: mockLogData,
            });

            expect(result).toBeDefined();
        });
    });

    describe('Token Expiration Validation', () => {
        it('should throw exception when endOfLife is not a valid date', async () => {
            const dbToken = createMockDBToken({
                endOfLife: new Date('invalid'),
            });
            mockIsValid.mockReturnValue(false);

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('end of life is invalid'),
                exceptionType: 'AuthenticationFailed',
                debugLevel: LogDebugLevel.WARNING,
            });
        });

        it('should throw exception when token is expired (endOfLife in the past)', async () => {
            const expiredDate = dayjs().subtract(1, 'hour').toDate();
            const dbToken = createMockDBToken({
                endOfLife: expiredDate,
            });
            mockIsValid.mockReturnValue(true);

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Refresh token has expired'),
                exceptionType: 'AuthenticationFailed',
                debugLevel: LogDebugLevel.INFO,
            });
        });

        it('should throw exception for inactive session with insufficient remaining lifetime', async () => {
            const dbToken = createMockDBToken({
                issuedAt: dayjs().subtract(AuthConfig.inactiveCutoff + 10, 'minutes').toDate(),
                endOfLife: dayjs().add(60, 'minutes').toDate(), // Not enough remaining life
            });
            mockIsValid.mockReturnValue(true);

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('inactive session'),
                exceptionType: 'AuthenticationFailed',
                debugLevel: LogDebugLevel.INFO,
            });
        });

        it('should pass for inactive session with sufficient remaining lifetime', async () => {
            const dbToken = createMockDBToken({
                issuedAt: dayjs().subtract(AuthConfig.inactiveCutoff + 10, 'minutes').toDate(),
                endOfLife: dayjs().add(AuthConfig.inactiveRefreshMinAge + 10, 'minutes').toDate(),
            });
            mockIsValid.mockReturnValue(true);

            const result = await verifyRefreshToken({
                dbToken,
                agent: mockAgent,
                ipAddress: authMockData.ipAddress,
                sendToken: 'sent-token',
                cookieList: mockCookies,
                account: mockAccount,
                logData: mockLogData,
            });

            expect(result).toBeDefined();
        });

        it('should pass for active session (recent issuedAt)', async () => {
            const dbToken = createMockDBToken({
                issuedAt: dayjs().subtract(10, 'minutes').toDate(),
                endOfLife: dayjs().add(7, 'days').toDate(),
            });
            mockIsValid.mockReturnValue(true);

            const result = await verifyRefreshToken({
                dbToken,
                agent: mockAgent,
                ipAddress: authMockData.ipAddress,
                sendToken: 'sent-token',
                cookieList: mockCookies,
                account: mockAccount,
                logData: mockLogData,
            });

            expect(result).toBeDefined();
        });
    });

    describe('User Status Validation', () => {
        it('should throw WARNING exception when user is not active', async () => {
            const dbToken = createMockDBToken({
                user: { active: false },
            });

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: 'User is not active',
                exceptionType: 'AuthenticationFailed',
                debugLevel: LogDebugLevel.WARNING,
            });
        });

        it('should throw WARNING exception when user has too many failed login attempts', async () => {
            const dbToken = createMockDBToken({
                user: { failedLoginCount: 6 },
            });

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: 'User has to many failed login attempts',
                exceptionType: 'AuthenticationFailed',
                debugLevel: LogDebugLevel.WARNING,
            });
        });

        it('should pass when failedLoginCount is exactly 5', async () => {
            const dbToken = createMockDBToken({
                user: { failedLoginCount: 5 },
            });

            const result = await verifyRefreshToken({
                dbToken,
                agent: mockAgent,
                ipAddress: authMockData.ipAddress,
                sendToken: 'sent-token',
                cookieList: mockCookies,
                account: mockAccount,
                logData: mockLogData,
            });

            expect(result).toBeDefined();
        });

        it('should throw WARNING exception when user is soft-deleted', async () => {
            const dbToken = createMockDBToken({
                user: { recDelete: dayjs().subtract(1, 'day').toDate() },
            });

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: 'User is deleted',
                exceptionType: 'AuthenticationFailed',
                debugLevel: LogDebugLevel.WARNING,
            });
        });

        it('should throw INFO exception when user must change password', async () => {
            const dbToken = createMockDBToken({
                user: { changePasswordOnLogin: true },
            });

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: 'User has to change. No refresh possible',
                exceptionType: 'AuthenticationFailed',
                debugLevel: LogDebugLevel.INFO,
            });
        });
    });

    describe('Organization ID Validation', () => {
        it('should throw WARNING exception when organisation IDs do not match', async () => {
            const dbToken = createMockDBToken({
                user: { organisationId: 'org-id-different' },
            });

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Organisation ID mismatch'),
                exceptionType: 'UnknownError',
                debugLevel: LogDebugLevel.WARNING,
            });
        });

        it('should pass when organisation IDs match', async () => {
            const dbToken = createMockDBToken({
                user: { organisationId: 'org-id-123' },
            });

            const result = await verifyRefreshToken({
                dbToken,
                agent: mockAgent,
                ipAddress: authMockData.ipAddress,
                sendToken: 'sent-token',
                cookieList: mockCookies,
                account: mockAccount,
                logData: mockLogData,
            });

            expect(result).toBeDefined();
        });
    });

    describe('Device Fingerprint Validation', () => {
        it('should call validateDeviceFingerprint with correct parameters', async () => {
            const dbToken = createMockDBToken();

            await verifyRefreshToken({
                dbToken,
                agent: mockAgent,
                ipAddress: '10.0.0.5',
                sendToken: 'sent-token',
                cookieList: mockCookies,
                account: mockAccount,
                logData: mockLogData,
            });

            expect(mockValidateDeviceFingerprint).toHaveBeenCalledWith({
                expected: {
                    ipAddress: authMockData.ipAddress,
                    deviceId: 'device-id-123',
                    userAgent: JSON.stringify(mockAgent),
                },
                current: {
                    ipAddress: '10.0.0.5',
                    userAgent: mockAgent,
                    deviceId: 'device-id-123',
                },
            });
        });

        it('should throw INFO exception when risk level is HIGH', async () => {
            const dbToken = createMockDBToken();
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.HIGH,
                reasons: ['IP address changed', 'User agent mismatch'],
            });

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Device fingerprint validation failed'),
                exceptionType: 'AuthenticationFailed',
                debugLevel: LogDebugLevel.INFO,
            });
        });

        it('should throw CRITICAL exception when risk level is SEVERE', async () => {
            const dbToken = createMockDBToken();
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.SEVERE,
                reasons: ['Device ID mismatch'],
            });

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Device fingerprint validation failed'),
                exceptionType: 'AuthenticationFailed',
                debugLevel: LogDebugLevel.CRITICAL,
            });
        });

        it('should include risk level and reasons in error message', async () => {
            const dbToken = createMockDBToken();
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.HIGH,
                reasons: ['IP changed dramatically', 'Browser version mismatch'],
            });

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('Risk level: 2'),
            });

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('IP changed dramatically, Browser version mismatch'),
            });
        });

        it('should pass when risk level is LOW', async () => {
            const dbToken = createMockDBToken();
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.LOW,
                reasons: [],
            });

            const result = await verifyRefreshToken({
                dbToken,
                agent: mockAgent,
                ipAddress: authMockData.ipAddress,
                sendToken: 'sent-token',
                cookieList: mockCookies,
                account: mockAccount,
                logData: mockLogData,
            });

            expect(result).toEqual({
                riskLevel: RiskLevel.LOW,
                reasons: [],
            });
        });

        it('should pass when risk level is MEDIUM', async () => {
            const dbToken = createMockDBToken();
            mockValidateDeviceFingerprint.mockResolvedValue({
                riskLevel: RiskLevel.MEDIUM,
                reasons: ['Minor IP change'],
            });

            const result = await verifyRefreshToken({
                dbToken,
                agent: mockAgent,
                ipAddress: authMockData.ipAddress,
                sendToken: 'sent-token',
                cookieList: mockCookies,
                account: mockAccount,
                logData: mockLogData,
            });

            expect(result).toEqual({
                riskLevel: RiskLevel.MEDIUM,
                reasons: ['Minor IP change'],
            });
        });

        it('should return fingerprint validation result on success', async () => {
            const dbToken = createMockDBToken();
            const expectedResult = {
                riskLevel: RiskLevel.LOW,
                reasons: [],
            };
            mockValidateDeviceFingerprint.mockResolvedValue(expectedResult);

            const result = await verifyRefreshToken({
                dbToken,
                agent: mockAgent,
                ipAddress: authMockData.ipAddress,
                sendToken: 'sent-token',
                cookieList: mockCookies,
                account: mockAccount,
                logData: mockLogData,
            });

            expect(result).toEqual(expectedResult);
        });
    });

    describe('Complete Validation Chain', () => {
        it('should pass all validations for a valid token', async () => {
            const dbToken = createMockDBToken();

            const result = await verifyRefreshToken({
                dbToken,
                agent: mockAgent,
                ipAddress: authMockData.ipAddress,
                sendToken: 'sent-token',
                cookieList: mockCookies,
                account: mockAccount,
                logData: mockLogData,
            });

            expect(result).toBeDefined();
            expect(mockSha256Hex).toHaveBeenCalledWith('sent-token');
            expect(mockValidateDeviceFingerprint).toHaveBeenCalled();
        });

        it('should fail early and not call validateDeviceFingerprint if token hash fails', async () => {
            const dbToken = createMockDBToken({ token: 'wrong-hash' });

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            expect(mockValidateDeviceFingerprint).not.toHaveBeenCalled();
        });

        it('should fail early and not call validateDeviceFingerprint if user is inactive', async () => {
            const dbToken = createMockDBToken({ user: { active: false } });

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toThrow();

            expect(mockValidateDeviceFingerprint).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should handle edge case where endOfLife is exactly now', async () => {
            const now = dayjs();
            const dbToken = createMockDBToken({
                endOfLife: now.subtract(1, 'second').toDate(), // Expired 1 second ago
            });
            mockIsValid.mockReturnValue(true);

            await expect(
                verifyRefreshToken({
                    dbToken,
                    agent: mockAgent,
                    ipAddress: authMockData.ipAddress,
                    sendToken: 'sent-token',
                    cookieList: mockCookies,
                    account: mockAccount,
                    logData: mockLogData,
                })
            ).rejects.toMatchObject({
                message: expect.stringContaining('expired'),
            });
        });

        it('should handle edge case where issuedAt is exactly at inactiveCutoff boundary', async () => {
            const dbToken = createMockDBToken({
                issuedAt: dayjs().subtract(AuthConfig.inactiveCutoff, 'minutes').toDate(),
                endOfLife: dayjs().add(5, 'hours').toDate(),
            });
            mockIsValid.mockReturnValue(true);

            const result = await verifyRefreshToken({
                dbToken,
                agent: mockAgent,
                ipAddress: authMockData.ipAddress,
                sendToken: 'sent-token',
                cookieList: mockCookies,
                account: mockAccount,
                logData: mockLogData,
            });

            expect(result).toBeDefined();
        });
    });
});
