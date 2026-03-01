/**
 * Unit Tests for Token Helper Functions
 * 
 * Tests token creation and rotation logic with mocked Prisma.
 * Validates atomic operations, transaction behavior, and error handling.
 */

import { issueNewRefreshToken, issueNewAccessToken, sha256Hex } from './helper.tokens';
import { prisma } from '@/lib/db';
import { AuthenticationException } from '@/errors/Authentication';
import { LogDebugLevel } from './LogDebugLeve.enum';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { AuthRole } from '@/lib/AuthRoles';
import crypto from 'crypto';

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

// Mock AuthConfig
jest.mock('./config', () => ({
    AuthConfig: {
        refreshTokenCookie: 'refresh-token-cookie-name',
    },
}));

// Mock crypto - must use factory function that doesn't reference external variables
jest.mock('crypto', () => {
    const actualCrypto = jest.requireActual('crypto');
    return {
        ...actualCrypto,
        randomBytes: jest.fn(),
        randomUUID: jest.fn(),
        default: {
            ...actualCrypto.default,
            randomBytes: jest.fn(),
            randomUUID: jest.fn(),
        }
    };
});

// Get references to mocked functions
const mockRandomBytes = jest.mocked(crypto.randomBytes);
const mockRandomUUID = jest.mocked(crypto.randomUUID);

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
        mockRandomBytes.mockReturnValue(Buffer.alloc(64, 'a')); // Exactly 64 bytes
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
                exceptionType: 'RefreshTokenReuseDetected',
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

    describe('Token Storage and Security', () => {
        it('should store hashed token in database, not plaintext', async () => {
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

            // Verify the token stored in DB is a hash, not the plaintext
            const createCall = mockTx.refreshToken.create.mock.calls[0][0];
            const storedToken = createCall.data.token;
            
            expect(storedToken).not.toBe(result); // Should NOT be plaintext
            expect(storedToken).toBe(sha256Hex(result)); // Should be hash
            expect(storedToken).toHaveLength(64); // SHA-256 = 64 hex chars
        });

        it('should use correct cookie name from AuthConfig', async () => {
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

            expect(mockCookieSet).toHaveBeenCalledWith(
                'refresh-token-cookie-name', // From AuthConfig
                expect.any(String),
                expect.any(Object)
            );
        });
    });

    describe('Default endOfLife behavior', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should default endOfLife to 3 days from now when not provided', async () => {
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
                // endOfLife NOT provided
            });

            const createCall = mockTx.refreshToken.create.mock.calls[0][0];
            const storedEndOfLife = createCall.data.endOfLife;

            const expectedDate = new Date('2024-01-04T12:00:00.000Z'); // 3 days later
            expect(storedEndOfLife.getTime()).toBe(expectedDate.getTime());
        });

        it('should use custom endOfLife when provided', async () => {
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

            const customDate = new Date('2024-02-15T10:30:00.000Z');
            await issueNewRefreshToken({
                ...baseProps,
                mode: 'new',
                endOfLife: customDate,
            });

            const createCall = mockTx.refreshToken.create.mock.calls[0][0];
            const storedEndOfLife = createCall.data.endOfLife;

            expect(storedEndOfLife).toBe(customDate);
        });
    });

    describe('Old token field verification (refresh mode)', () => {
        const refreshProps = {
            ...baseProps,
            mode: 'refresh' as const,
            usedRefreshTokenId: 'old-token-id',
            userAgent: mockUserAgent,
        };

        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2024-01-15T14:30:00.000Z'));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should set usedAt timestamp to current time', async () => {
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

            const updateCall = mockTx.refreshToken.update.mock.calls[0][0];
            const usedAt = updateCall.data.usedAt;

            expect(usedAt).toBeInstanceOf(Date);
            expect(usedAt.getTime()).toBe(new Date('2024-01-15T14:30:00.000Z').getTime());
        });

        it('should set usedIpAddress to provided IP address', async () => {
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

            const updateCall = mockTx.refreshToken.update.mock.calls[0][0];
            expect(updateCall.data.usedIpAddress).toBe('192.168.1.1');
        });

        it('should serialize usedUserAgent as JSON string', async () => {
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

            const updateCall = mockTx.refreshToken.update.mock.calls[0][0];
            const usedUserAgent = updateCall.data.usedUserAgent;

            expect(typeof usedUserAgent).toBe('string');
            expect(() => JSON.parse(usedUserAgent)).not.toThrow();
            expect(JSON.parse(usedUserAgent)).toEqual(mockUserAgent);
        });

        it('should change status from "active" to "rotated"', async () => {
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

            const updateCall = mockTx.refreshToken.update.mock.calls[0][0];
            
            // Where clause checks it was "active"
            expect(updateCall.where.status).toBe('active');
            // Data sets it to "rotated"
            expect(updateCall.data.status).toBe('rotated');
        });
    });

    describe('Created token record validation', () => {
        it('should set all required fields correctly in new mode', async () => {
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

            const customEndOfLife = new Date('2024-02-01T00:00:00.000Z');
            await issueNewRefreshToken({
                ...baseProps,
                mode: 'new',
                endOfLife: customEndOfLife,
            });

            const createCall = mockTx.refreshToken.create.mock.calls[0][0];
            const data = createCall.data;

            expect(data.userId).toBe('user-123');
            expect(data.deviceId).toBe('device-456');
            expect(data.sessionId).toBe('session-789');
            expect(data.issuerIpAddress).toBe('192.168.1.1');
            expect(data.status).toBe('active');
            expect(data.rotatedFromTokenId).toBeNull();
            expect(data.endOfLife).toBe(customEndOfLife);
            expect(data.tokenFamilyId).toBe('11111111-1111-1111-1111-111111111111'); // Mocked UUID
        });

        it('should set rotatedFromTokenId in refresh mode', async () => {
            const mockTx = {
                refreshToken: {
                    update: jest.fn().mockResolvedValue({
                        id: 'old-token-id',
                        tokenFamilyId: 'family-xyz',
                    }),
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
                mode: 'refresh',
                usedRefreshTokenId: 'old-token-id',
                userAgent: mockUserAgent,
            });

            const createCall = mockTx.refreshToken.create.mock.calls[0][0];
            expect(createCall.data.rotatedFromTokenId).toBe('old-token-id');
        });

        it('should verify token is valid base64url format', async () => {
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

            // base64url should only contain: A-Z, a-z, 0-9, -, _
            expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('Token revocation endOfLife filtering', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should only revoke tokens with endOfLife > now', async () => {
            const mockTx = {
                refreshToken: {
                    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
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

            const updateManyCall = mockTx.refreshToken.updateMany.mock.calls[0][0];
            expect(updateManyCall.where.endOfLife).toEqual({
                gt: new Date('2024-01-15T12:00:00.000Z')
            });
        });
    });
});

describe('issueNewAccessToken', () => {
    const mockSave = jest.fn();
    const mockIronSession: {
        user?: {
            id: string;
            name: string;
            username: string;
            role: number;
            organisationId: string;
            acronym: string;
        };
        sessionId?: string;
        save: jest.Mock;
    } = {
        user: undefined,
        sessionId: undefined,
        save: mockSave,
    };

    const mockUser = {
        id: 'user-123',
        name: 'John Doe',
        username: 'johndoe',
        role: AuthRole.admin,
        // ... other User fields not used by function
    };

    const mockOrganisation = {
        id: 'org-456',
        acronym: 'ACME',
        // ... other Organisation fields not used by function
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockIronSession.user = undefined;
        mockIronSession.sessionId = undefined;
    });

    it('should set ironSession.user with all required fields', async () => {
        await issueNewAccessToken({
            user: mockUser as never,
            sessionId: 'session-789',
            ironSession: mockIronSession as never,
            organisation: mockOrganisation as never,
        });

        expect(mockIronSession.user).toEqual({
            id: 'user-123',
            name: 'John Doe',
            username: 'johndoe',
            role: AuthRole.admin,
            organisationId: 'org-456',
            acronym: 'ACME',
        });
    });

    it('should set ironSession.sessionId', async () => {
        await issueNewAccessToken({
            user: mockUser as never,
            sessionId: 'session-xyz-123',
            ironSession: mockIronSession as never,
            organisation: mockOrganisation as never,
        });

        expect(mockIronSession.sessionId).toBe('session-xyz-123');
    });

    it('should call ironSession.save()', async () => {
        await issueNewAccessToken({
            user: mockUser as never,
            sessionId: 'session-789',
            ironSession: mockIronSession as never,
            organisation: mockOrganisation as never,
        });

        expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('should map organisation.acronym to session', async () => {
        const orgWithDifferentAcronym = {
            ...mockOrganisation,
            acronym: 'TEST-ORG',
        };

        await issueNewAccessToken({
            user: mockUser as never,
            sessionId: 'session-789',
            ironSession: mockIronSession as never,
            organisation: orgWithDifferentAcronym as never,
        });

        expect(mockIronSession.user?.acronym).toBe('TEST-ORG');
    });

    it('should handle different user roles correctly', async () => {
        const userWithRole = {
            ...mockUser,
            role: AuthRole.inspector,
        };

        await issueNewAccessToken({
            user: userWithRole as never,
            sessionId: 'session-789',
            ironSession: mockIronSession as never,
            organisation: mockOrganisation as never,
        });

        expect(mockIronSession.user?.role).toBe(AuthRole.inspector);
    });

    it('should be async and await save completion', async () => {
        let saveCompleted = false;
        mockSave.mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            saveCompleted = true;
        });

        await issueNewAccessToken({
            user: mockUser as never,
            sessionId: 'session-789',
            ironSession: mockIronSession as never,
            organisation: mockOrganisation as never,
        });

        expect(saveCompleted).toBe(true);
    });
});

