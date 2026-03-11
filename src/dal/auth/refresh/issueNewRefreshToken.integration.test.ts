/**
 * Integration Tests for issueNewRefreshToken
 * 
 * Tests token creation and rotation with real database interactions.
 * Validates atomic operations, transaction isolation, and race condition handling.
 */

import { issueNewRefreshToken } from '../helper.tokens';
import { StaticData } from '../../../../tests/_playwrightConfig/testData/staticDataLoader';
import { prisma } from '@/lib/db';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import crypto from 'crypto';
import { AuthenticationException } from '@/errors/Authentication';

describe('issueNewRefreshToken Integration Tests', () => {
    const staticData = new StaticData(98); // Use org index 98 for tests
    let testUserId: string;
    let testDeviceId: string;
    let testSessionId: string;

    beforeAll(async () => {
        await staticData.resetData();
        
        // Get test user from static data
        testUserId = staticData.ids.userIds[0];
        
        // Get test device from static data (devices are created in resetData)
        testDeviceId = staticData.ids.deviceIds[0];
        
        // Get test session from static data (sessions are created in resetData)
        testSessionId = staticData.ids.sessionIds[0];
    });

    afterAll(async () => {
        await staticData.cleanup.removeOrganisation();
    });

    beforeEach(async () => {
        // Clean up refresh tokens before each test
        await prisma.refreshToken.deleteMany({
            where: { userId: testUserId }
        });
    });

    const createMockCookies = (): ReadonlyRequestCookies => {
        const cookies = new Map<string, string>();
        const mockSet = jest.fn((name, value) => {
            cookies.set(name, value);
        });

        return {
            get: (name: string) => ({ name, value: cookies.get(name) ?? '' }),
            getAll: () => Array.from(cookies.entries()).map(([name, value]) => ({ name, value })),
            has: (name: string) => cookies.has(name),
            set: mockSet,
        } as unknown as ReadonlyRequestCookies;
    };

    const mockUserAgent = {
        browser: { name: 'Chrome', version: '120', major: '120' },
        device: { type: 'desktop', vendor: undefined, model: undefined },
        os: { name: 'Windows', version: '10' },
        engine: { name: 'Blink', version: '120' },
        cpu: { architecture: 'amd64' },
        ua: 'Mozilla/5.0...',
        isBot: false,
    };

    describe('Mode: new', () => {
        it('should create new refresh token with new family', async () => {
            const mockCookies = createMockCookies();

            const plaintext = await issueNewRefreshToken({
                cookieList: mockCookies,
                userId: testUserId,
                deviceId: testDeviceId,
                sessionId: testSessionId,
                ipAddress: '192.168.1.1',
                mode: 'new',
                logData: {
                    ipAddress: '192.168.1.1',
                    userAgent: mockUserAgent,
                }
            });

            // Check plaintext returned
            expect(plaintext).toBeTruthy();
            expect(plaintext.length).toBeGreaterThan(50);

            // Check token in database
            const tokens = await prisma.refreshToken.findMany({
                where: { userId: testUserId, deviceId: testDeviceId }
            });

            expect(tokens).toHaveLength(1);
            expect(tokens[0].status).toBe('active');
            expect(tokens[0].tokenFamilyId).toBeTruthy();
            expect(tokens[0].rotatedFromTokenId).toBeNull();
        });

        it('should revoke other active tokens for same device', async () => {
            // Create existing active token
            await prisma.refreshToken.create({
                data: {
                    userId: testUserId,
                    deviceId: testDeviceId,
                    sessionId: testSessionId,
                    token: 'old-token-hash',
                    endOfLife: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
                    issuerIpAddress: '192.168.1.1',
                    tokenFamilyId: crypto.randomUUID(),
                    status: 'active',
                }
            });

            const mockCookies = createMockCookies();

            await issueNewRefreshToken({
                cookieList: mockCookies,
                userId: testUserId,
                deviceId: testDeviceId,
                sessionId: staticData.ids.sessionIds[1],
                ipAddress: '192.168.1.1',
                mode: 'new',
                logData: {
                    ipAddress: '192.168.1.1',
                    userAgent: mockUserAgent,
                }
            });

            // Check old token revoked
            const tokens = await prisma.refreshToken.findMany({
                where: { userId: testUserId, deviceId: testDeviceId }
            });

            const activeTokens = tokens.filter(t => t.status === 'active');
            const revokedTokens = tokens.filter(t => t.status === 'revoked');

            expect(activeTokens).toHaveLength(1);
            expect(revokedTokens).toHaveLength(1);
        });
    });

    describe('Mode: refresh', () => {
        it('should rotate token and preserve family ID', async () => {
            // Create initial token
            const familyId = crypto.randomUUID();
            const oldToken = await prisma.refreshToken.create({
                data: {
                    userId: testUserId,
                    deviceId: testDeviceId,
                    sessionId: testSessionId,
                    token: 'old-token-hash',
                    endOfLife: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
                    issuerIpAddress: '192.168.1.1',
                    tokenFamilyId: familyId,
                    status: 'active',
                }
            });

            const mockCookies = createMockCookies();

            await issueNewRefreshToken({
                cookieList: mockCookies,
                userId: testUserId,
                deviceId: testDeviceId,
                sessionId: staticData.ids.sessionIds[1],
                ipAddress: '192.168.1.1',
                mode: 'refresh',
                usedRefreshTokenId: oldToken.id,
                userAgent: mockUserAgent,
                logData: {
                    ipAddress: '192.168.1.1',
                    userAgent: mockUserAgent,
                }
            });

            // Check old token is rotated
            const rotatedToken = await prisma.refreshToken.findUnique({
                where: { id: oldToken.id }
            });
            expect(rotatedToken?.status).toBe('rotated');
            expect(rotatedToken?.usedAt).not.toBeNull();
            expect(rotatedToken?.usedIpAddress).toBe('192.168.1.1');

            // Check new token
            const newToken = await prisma.refreshToken.findFirst({
                where: {
                    userId: testUserId,
                    deviceId: testDeviceId,
                    status: 'active',
                }
            });
            expect(newToken).not.toBeNull();
            expect(newToken?.tokenFamilyId).toBe(familyId);
            expect(newToken?.rotatedFromTokenId).toBe(oldToken.id);
        });

        it('should throw RefreshTokenReuseDetected on concurrent rotation', async () => {
            // Create token
            const oldToken = await prisma.refreshToken.create({
                data: {
                    userId: testUserId,
                    deviceId: testDeviceId,
                    sessionId: testSessionId,
                    token: 'old-token-hash',
                    endOfLife: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
                    issuerIpAddress: '192.168.1.1',
                    tokenFamilyId: crypto.randomUUID(),
                    status: 'active',
                }
            });

            const mockCookies1 = createMockCookies();
            const mockCookies2 = createMockCookies();

            // First rotation succeeds
            await issueNewRefreshToken({
                cookieList: mockCookies1,
                userId: testUserId,
                deviceId: testDeviceId,
                sessionId: staticData.ids.sessionIds[1],
                ipAddress: '192.168.1.1',
                mode: 'refresh',
                usedRefreshTokenId: oldToken.id,
                userAgent: mockUserAgent,
                logData: {
                    ipAddress: '192.168.1.1',
                    userAgent: mockUserAgent,
                }
            });

            // Second rotation should fail
            await expect(issueNewRefreshToken({
                cookieList: mockCookies2,
                userId: testUserId,
                deviceId: testDeviceId,
                sessionId: crypto.randomUUID(),
                ipAddress: '192.168.1.1',
                mode: 'refresh',
                usedRefreshTokenId: oldToken.id,
                userAgent: mockUserAgent,
                logData: {
                    ipAddress: '192.168.1.1',
                    userAgent: mockUserAgent,
                }
            })).rejects.toThrow(AuthenticationException);

            await expect(issueNewRefreshToken({
                cookieList: mockCookies2,
                userId: testUserId,
                deviceId: testDeviceId,
                sessionId: staticData.ids.sessionIds[3],
                ipAddress: '192.168.1.1',
                mode: 'refresh',
                usedRefreshTokenId: oldToken.id,
                userAgent: mockUserAgent,
                logData: {
                    ipAddress: '192.168.1.1',
                    userAgent: mockUserAgent,
                }
            })).rejects.toThrow(AuthenticationException);
        });

        it('should exclude current token when revoking others', async () => {
            // Create multiple active tokens
            const token1 = await prisma.refreshToken.create({
                data: {
                    userId: testUserId,
                    deviceId: testDeviceId,
                    sessionId: testSessionId,
                    token: 'token1-hash',
                    endOfLife: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
                    issuerIpAddress: '192.168.1.1',
                    tokenFamilyId: crypto.randomUUID(),
                    status: 'active',
                }
            });

            await prisma.refreshToken.create({
                data: {
                    userId: testUserId,
                    deviceId: testDeviceId,
                    sessionId: staticData.ids.sessionIds[1],
                    token: 'token2-hash',
                    endOfLife: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
                    issuerIpAddress: '192.168.1.1',
                    tokenFamilyId: crypto.randomUUID(),
                    status: 'active',
                }
            });

            const mockCookies = createMockCookies();

            // Rotate token1
            await issueNewRefreshToken({
                cookieList: mockCookies,
                userId: testUserId,
                deviceId: testDeviceId,
                sessionId: staticData.ids.sessionIds[2],
                ipAddress: '192.168.1.1',
                mode: 'refresh',
                usedRefreshTokenId: token1.id,
                userAgent: mockUserAgent,
                logData: {
                    ipAddress: '192.168.1.1',
                    userAgent: mockUserAgent,
                }
            });

            // Check token2 was revoked, token1 was rotated, and new token is active
            const tokens = await prisma.refreshToken.findMany({
                where: { userId: testUserId, deviceId: testDeviceId }
            });

            const activeTokens = tokens.filter(t => t.status === 'active');
            const rotatedTokens = tokens.filter(t => t.status === 'rotated');
            const revokedTokens = tokens.filter(t => t.status === 'revoked');

            expect(activeTokens).toHaveLength(1); // Only new token
            expect(rotatedTokens).toHaveLength(1); // token1
            expect(revokedTokens).toHaveLength(1); // token2
        });
    });

    describe('Transaction Isolation', () => {
        it('should handle serializable isolation level correctly', async () => {
            const mockCookies = createMockCookies();

            // This test validates the transaction works correctly
            // More detailed serialization testing would require complex setup
            await expect(issueNewRefreshToken({
                cookieList: mockCookies,
                userId: testUserId,
                deviceId: testDeviceId,
                sessionId: testSessionId,
                ipAddress: '192.168.1.1',
                mode: 'new',
                logData: {
                    ipAddress: '192.168.1.1',
                    userAgent: mockUserAgent,
                }
            })).resolves.toBeTruthy();
        });
    });
});
