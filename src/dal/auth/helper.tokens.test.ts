/**
 * Unit Tests for Token Helper Functions
 * 
 * Tests token creation and rotation logic with mocked Prisma.
 * Validates atomic operations, transaction behavior, and error handling.
 */

import { issueNewRefreshToken, sha256Hex } from './helper.tokens';
import { prisma } from '@/lib/db';
import { AuthenticationException } from '@/errors/Authentication';
import { LogDebugLevel } from './LogDebugLeve.enum';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

// Mock Prisma
jest.mock('@/lib/db', () => ({
    prisma: {
        $transaction: jest.fn(),
        refreshToken: {
            update: jest.fn(),
            updateMany: jest.fn(),
            create: jest.fn(),
        }
    }
}));

// Mock crypto.randomBytes to return controlled value
const originalCrypto = jest.requireActual('crypto');
const mockRandomBytes = jest.fn();
const mockRandomUUID = jest.fn();

jest.mock('crypto', () => ({
    ...originalCrypto,
    randomBytes: mockRandomBytes,
    randomUUID: mockRandomUUID,
    default: {
        ...originalCrypto.default,
        randomBytes: mockRandomBytes,
        randomUUID: mockRandomUUID,
    }
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('sha256Hex', () => {
    it('should return consistent hex hash for same input', () => {
        const input = 'test-token-123';
        const hash1 = sha256Hex(input);
        const hash2 = sha256Hex(input);

        expect(hash1).toBe(hash2);
        expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it('should produce different hashes for different inputs', () => {
        const hash1 = sha256Hex('token-1');
        const hash2 = sha256Hex('token-2');

        expect(hash1).not.toBe(hash2);
    });
});

describe('issueNewRefreshToken', () => {
    const mockCookieSet = jest.fn();
    const mockCookies = {
        set: mockCookieSet,
    } as unknown as ReadonlyRequestCookies;

    const mockUserAgent = {
        browser: { name: 'Chrome', version: '120', major: '120' },
        device: { type: 'desktop', vendor: undefined, model: undefined },
        os: { name: 'Windows', version: '10' },
        engine: { name: 'Blink', version: '120' },
        cpu: { architecture: 'amd64' },
        ua: 'Mozilla/5.0...',
        isBot: false,
    };

    const baseProps = {
        cookieList: mockCookies,
        userId: 'user-123',
        deviceId: 'device-456',
        sessionId: 'session-789',
        ipAddress: '192.168.1.1',
        logData: {
            success: false,
            ipAddress: '192.168.1.1',
            details: 'test',
            action: 'REFRESH_ACCESS_TOKEN' as const,
            userAgent: mockUserAgent,
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Default crypto mocks
        mockRandomBytes.mockReturnValue(Buffer.from('mock-random-token-64-bytes-long-for-testing-purposes-abc123def456'));
        mockRandomUUID.mockReturnValue('11111111-1111-1111-1111-111111111111');
    });

    describe('Mode: new', () => {
        it('should create new token with new family ID', async () => {
            const mockTx = {
                refreshToken: {
                    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
                    create: jest.fn().mockResolvedValue({}),
                }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockTx);
            });

            const result = await issueNewRefreshToken({
                ...baseProps,
                mode: 'new',
            });

            expect(result).toBeTruthy();
            expect(result).toHaveLength(86); // base64url of 64 bytes
            expect(mockRandomUUID).toHaveBeenCalled();
            expect(mockTx.refreshToken.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 'user-123',
                    deviceId: 'device-456',
                    tokenFamilyId: '11111111-1111-1111-1111-111111111111',
                    rotatedFromTokenId: null,
                    status: 'active',
                })
            });
        });

        it('should revoke other active tokens for same device in new mode', async () => {
            const mockTx = {
                refreshToken: {
                    updateMany: jest.fn().mockResolvedValue({ count: 2 }),
                    create: jest.fn().mockResolvedValue({}),
                }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockTx);
            });

            await issueNewRefreshToken({
                ...baseProps,
                mode: 'new',
            });

            expect(mockTx.refreshToken.updateMany).toHaveBeenCalledWith({
                where: {
                    deviceId: 'device-456',
                    userId: 'user-123',
                    status: 'active',
                    endOfLife: { gt: expect.any(Date) },
                },
                data: { status: 'revoked' }
            });
        });

        it('should set cookie with correct options', async () => {
            const mockTx = {
                refreshToken: {
                    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
                    create: jest.fn().mockResolvedValue({}),
                }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockTx);
            });

            const customExpiry = new Date('2026-03-01');
            await issueNewRefreshToken({
                ...baseProps,
                mode: 'new',
                endOfLife: customExpiry,
            });

            expect(mockCookieSet).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.objectContaining({
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    expires: customExpiry,
                    path: '/api/auth/refresh',
                })
            );
        });
    });

    describe('Mode: refresh', () => {
        const refreshProps = {
            ...baseProps,
            mode: 'refresh' as const,
            usedRefreshTokenId: 'old-token-id',
            userAgent: mockUserAgent,
        };

        it('should mark old token as rotated atomically', async () => {
            const mockTx = {
                refreshToken: {
                    update: jest.fn().mockResolvedValue({
                        id: 'old-token-id',
                        tokenFamilyId: 'family-123',
                    }),
                    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
                    create: jest.fn().mockResolvedValue({}),
                }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockTx);
            });

            await issueNewRefreshToken(refreshProps);

            expect(mockTx.refreshToken.update).toHaveBeenCalledWith({
                where: {
                    id: 'old-token-id',
                    userId: 'user-123',
                    status: 'active',
                    usedAt: null, // Atomic check
                },
                data: {
                    usedAt: expect.any(Date),
                    usedIpAddress: '192.168.1.1',
                    usedUserAgent: expect.any(String),
                    status: 'rotated',
                }
            });
        });

        it('should preserve token family ID from old token', async () => {
            const mockTx = {
                refreshToken: {
                    update: jest.fn().mockResolvedValue({
                        id: 'old-token-id',
                        tokenFamilyId: 'family-abc-456',
                    }),
                    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
                    create: jest.fn().mockResolvedValue({}),
                }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockTx);
            });

            await issueNewRefreshToken(refreshProps);

            expect(mockTx.refreshToken.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    tokenFamilyId: 'family-abc-456',
                    rotatedFromTokenId: 'old-token-id',
                })
            });
        });

        it('should throw RefreshTokenReuseDetected on P2025 error', async () => {
            mockPrisma.$transaction.mockRejectedValue({
                code: 'P2025',
                message: 'Record not found'
            });

            await expect(issueNewRefreshToken(refreshProps)).rejects.toThrow(AuthenticationException);
            await expect(issueNewRefreshToken(refreshProps)).rejects.toMatchObject({
                code: 'RefreshTokenReuseDetected',
                debugLevel: LogDebugLevel.CRITICAL,
            });
        });

        it('should exclude current token when revoking others', async () => {
            const mockTx = {
                refreshToken: {
                    update: jest.fn().mockResolvedValue({
                        id: 'old-token-id',
                        tokenFamilyId: 'family-123',
                    }),
                    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                    create: jest.fn().mockResolvedValue({}),
                }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockTx);
            });

            await issueNewRefreshToken(refreshProps);

            expect(mockTx.refreshToken.updateMany).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    id: { not: 'old-token-id' }, // Exclude current token
                }),
                data: { status: 'revoked' }
            });
        });
    });

    describe('Transaction Behavior', () => {
        it('should use Serializable isolation level', async () => {
            const mockTx = {
                refreshToken: {
                    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
                    create: jest.fn().mockResolvedValue({}),
                }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockTx);
            });

            await issueNewRefreshToken({
                ...baseProps,
                mode: 'new',
            });

            expect(mockPrisma.$transaction).toHaveBeenCalledWith(
                expect.any(Function),
                {
                    isolationLevel: 'Serializable',
                    timeout: 5000,
                }
            );
        });

        it('should set 5 second timeout', async () => {
            const mockTx = {
                refreshToken: {
                    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
                    create: jest.fn().mockResolvedValue({}),
                }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockTx);
            });

            await issueNewRefreshToken({
                ...baseProps,
                mode: 'new',
            });

            const transactionOptions = mockPrisma.$transaction.mock.calls[0][1];
            expect(transactionOptions).toEqual({
                isolationLevel: 'Serializable',
                timeout: 5000,
            });
        });

        it('should rethrow non-P2025 errors', async () => {
            const customError = new Error('Database connection failed');
            mockPrisma.$transaction.mockRejectedValue(customError);

            await expect(issueNewRefreshToken({
                ...baseProps,
                mode: 'new',
            })).rejects.toThrow('Database connection failed');
        });
    });

    describe('Return Value', () => {
        it('should return plaintext token that was created', async () => {
            const mockTx = {
                refreshToken: {
                    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
                    create: jest.fn().mockResolvedValue({}),
                }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockTx);
            });

            mockRandomBytes.mockReturnValue(Buffer.from('a'.repeat(64)));

            const result = await issueNewRefreshToken({
                ...baseProps,
                mode: 'new',
            });

            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            
            // Cookie should be set with same token
            const cookieToken = mockCookieSet.mock.calls[0][1];
            expect(cookieToken).toBe(result);
        });
    });
});

