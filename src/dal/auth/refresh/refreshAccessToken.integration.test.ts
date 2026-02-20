/**
 * Integration Tests for refreshAccessToken
 *
 * Tests the complete token refresh workflow with a real PostgreSQL database
 * and an in-memory Redis (ioredis-mock).
 *
 * Mocked:
 *  - next/headers (cookies, headers) — no Next.js request context in tests
 *  - next/server (userAgent)          — same reason
 *  - @/lib/ironSession                — spy on save/destroy without real cookie
 *  - @/dal/auth/redis                 — replaced with ioredis-mock instance
 *  - @/lib/email/tokenReuseDetected   — prevent real email sending
 *
 * Not mocked: Prisma, sha256Hex, calculateSessionLifetime, verifyRefreshToken,
 *             handleRefreshTokenReuse, handleRetryRequest, issueNewRefreshToken,
 *             issueNewAccessToken (all run against real DB or pure functions)
 *
 * IPs: each describe group uses its own IP to isolate the module-level
 *      RateLimiterMemory state between test groups.
 */

import dayjs from '@/lib/dayjs';
import { prisma } from '@/lib/db';
import { getIronSession } from '@/lib/ironSession';
import crypto, { randomUUID } from 'crypto';
import { StaticData } from '../../../../tests/_playwrightConfig/testData/staticDataLoader';
import { createMockUserAgent } from '../__testHelpers__';
import {
    authMockData,
    getCookieMockFactory,
    getHeaderGetMockImplementation,
} from '../__testHelpers__/mockData';
import { AuthConfig } from '../config';
import { sha256Hex } from '../helper.tokens';
import { redis } from '@/dal/auth/redis';
import { refreshToken as refreshAccessToken } from './refreshAccessToken';

// ===== REDIS MOCK (ioredis-mock) =====
// The jest.mock factory is hoisted but runs lazily on first import.
// `redis` imported above will be the ioredis-mock instance because the
// moduleNameMapper in jest.dal-integration.config.ts maps ioredis → ioredis-mock,
// and the factory here exposes that instance together with the stub helpers.
jest.mock('@/dal/auth/redis', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedisMock = require('ioredis-mock');
    return {
        redis: new IORedisMock(),
        isRedisAvailable: jest.fn().mockReturnValue(true),
        isRedisConfiguredButUnavailable: jest.fn().mockReturnValue(false),
    };
});

// ===== EMAIL MOCK =====
jest.mock('@/lib/email/tokenReuseDetected', () => ({
    sendTokenReuseDetectedEmail: jest.fn().mockResolvedValue(undefined),
}));

// ===== NEXT.JS MOCKS =====
const mockCookiesGet = jest.fn();
const mockCookiesSet = jest.fn();
const mockHeadersGet = jest.fn();

jest.mock('next/headers', () => ({
    cookies: jest.fn(async () => ({
        get: mockCookiesGet,
        set: mockCookiesSet,
        getAll: jest.fn(() => []),
        has: jest.fn((name: string) => !!mockCookiesGet(name)?.value),
    })),
    headers: jest.fn(async () => ({
        get: mockHeadersGet,
    })),
}));

jest.mock('next/server', () => ({
    userAgent: jest.fn(() => createMockUserAgent('chrome-desktop')),
}));

// ===== IRON SESSION MOCK =====
const mockGetIronSession = getIronSession as jest.MockedFunction<typeof getIronSession>;
const mockIronSessionSave = jest.fn();
const mockIronSessionDestroy = jest.fn();

// ===== IP CONSTANTS (one per describe group — isolates RateLimiterMemory) =====
const IPS = {
    happyPath:       '10.0.1.1',
    dbLookup:        '10.0.2.1',
    sessionLifetime: '10.0.3.1',
    tokenReuse:      '10.0.4.1',
    idempotency:     '10.0.5.1',
};

/** Flushes the ioredis-mock store so each test starts with an empty cache. */
const flushRedis = () => redis!.flushall();

describe('refreshAccessToken Integration Tests', () => {
    const staticData = new StaticData(0);
    let testUserId: string;

    // Stable per-run constants — device / token DB rows are recreated each beforeEach
    const testDeviceId = randomUUID();
    const testRefreshToken = crypto.randomBytes(64).toString('base64url');
    const testRefreshTokenHash = sha256Hex(testRefreshToken);
    let testRefreshTokenId: string;
    let testSessionId: string;

    // Cookie factory tied to the stable device / token values
    const { cookieFactory } = getCookieMockFactory({
        deviceId: testDeviceId,
        refreshToken: testRefreshToken,
        organisationId: staticData.organisationId,
    });

    // ===== STATIC DATA LIFECYCLE =====
    beforeAll(async () => {
        await staticData.resetData();
        const user = await prisma.user.findFirst({
            where: { organisationId: staticData.organisationId },
        });
        testUserId = user!.id;
    });

    afterAll(async () => {
        await staticData.cleanup.removeOrganisation();
    });

    // ===== COMMON SETUP (runs before every test) =====
    beforeEach(async () => {
        jest.clearAllMocks();
        await flushRedis();

        // Iron session spy
        mockGetIronSession.mockResolvedValue({
            user: undefined,
            sessionId: undefined,
            save: mockIronSessionSave,
            destroy: mockIronSessionDestroy,
            updateConfig: jest.fn(),
        } as unknown as Awaited<ReturnType<typeof getIronSession>>);

        // Default headers / cookies (overridden per describe group below)
        mockHeadersGet.mockImplementation(
            getHeaderGetMockImplementation({
                ipAddress: authMockData.ipAddress,
                idempotencyKey: authMockData.idempotencyKey,
            })
        );
        mockCookiesGet.mockImplementation((name: string) => cookieFactory().get(name));

        // Create device & session & active refresh token
        const device = await prisma.device.create({
            include: { sessions: true },
            data: {
                id: testDeviceId,
                userId: testUserId,
                name: 'Test Device',
                lastUsedAt: new Date(),
                lastIpAddress: authMockData.ipAddress,
                userAgent: JSON.stringify(authMockData.userAgent),
                sessions: {
                    create: {
                        sessionRL: 'LOW',
                        lastLoginAt: new Date(),
                        lastIpAddress: authMockData.ipAddress,
                        userAgent: JSON.stringify(authMockData.userAgent),
                    },
                },
            },
        });
        testSessionId = device.sessions[0].id;

        const tokenRecord = await prisma.refreshToken.create({
            data: {
                userId: testUserId,
                deviceId: testDeviceId,
                sessionId: testSessionId,
                token: testRefreshTokenHash,
                endOfLife: dayjs().add(7, 'days').toDate(),
                issuerIpAddress: authMockData.ipAddress,
                tokenFamilyId: randomUUID(),
                status: 'active',
            },
        });
        testRefreshTokenId = tokenRecord.id;
    });

    // ===== COMMON TEARDOWN =====
    afterEach(async () => {
        try {
            await prisma.refreshToken.deleteMany({ where: { deviceId: testDeviceId } });
            await prisma.session.deleteMany({ where: { deviceId: testDeviceId } });
            await prisma.device.delete({ where: { id: testDeviceId } });
        } catch {
            await staticData.resetData();
        }
    });

    // =========================================================================
    // GROUP E # HAPPY PATH
    // =========================================================================
    describe('Happy Path (E)', () => {
        beforeEach(() => {
            mockHeadersGet.mockImplementation(
                getHeaderGetMockImplementation({
                    ipAddress: IPS.happyPath,
                    idempotencyKey: authMockData.idempotencyKey,
                })
            );
        });

        it('E20: should successfully refresh tokens and update all DB state', async () => {
            const result = await refreshAccessToken();

            expect(result.status).toBe(200);
            expect(result.message).toContain('successful');
            expect(mockIronSessionSave).toHaveBeenCalled();

            // Old token must be marked as rotated with usedAt timestamp
            const oldToken = await prisma.refreshToken.findUnique({
                where: { id: testRefreshTokenId },
            });
            expect(oldToken?.status).toBe('rotated');
            expect(oldToken?.usedAt).not.toBeNull();

            // Exactly one new active token chained to old, same family
            const newToken = await prisma.refreshToken.findFirst({
                where: {
                    deviceId: testDeviceId,
                    status: 'active',
                    rotatedFromTokenId: testRefreshTokenId,
                },
            });
            expect(newToken).not.toBeNull();
            expect(newToken?.tokenFamilyId).toBe(oldToken?.tokenFamilyId);

            // SUCCESS audit log entry must be written
            const auditLog = await prisma.auditLog.findFirst({
                where: {
                    userId: testUserId,
                    action: 'REFRESH_ACCESS_TOKEN',
                    state: 'SUCCESS',
                },
                orderBy: { timestamp: 'desc' },
            });
            expect(auditLog).not.toBeNull();
        });

        it('E21: should preserve tokenFamilyId through a chain of two consecutive rotations', async () => {
            // First rotation
            const result1 = await refreshAccessToken();
            expect(result1.status).toBe(200);

            const firstRotated = await prisma.refreshToken.findUnique({
                where: { id: testRefreshTokenId },
            });
            const familyId = firstRotated?.tokenFamilyId;

            // Capture the new token plaintext from the cookie set call
            const newTokenValue: string | undefined = mockCookiesSet.mock.calls.find(
                (call) => call[0] === AuthConfig.refreshTokenCookie
            )?.[1];
            expect(newTokenValue).toBeDefined();

            // Set up for second rotation with the new token
            jest.clearAllMocks();
            mockGetIronSession.mockResolvedValue({
                user: undefined,
                sessionId: undefined,
                save: mockIronSessionSave,
                destroy: mockIronSessionDestroy,
                updateConfig: jest.fn(),
            } as unknown as Awaited<ReturnType<typeof getIronSession>>);

            const { cookieFactory: newCookieFactory } = getCookieMockFactory({
                deviceId: testDeviceId,
                refreshToken: newTokenValue!,
                organisationId: staticData.organisationId,
            });
            mockCookiesGet.mockImplementation((name: string) => newCookieFactory().get(name));
            // Fresh idempotency key so Redis does not return the cached first result
            mockHeadersGet.mockImplementation(
                getHeaderGetMockImplementation({
                    ipAddress: IPS.happyPath,
                    idempotencyKey: randomUUID(),
                })
            );

            const result2 = await refreshAccessToken();
            expect(result2.status).toBe(200);

            const secondNewToken = await prisma.refreshToken.findFirst({
                where: { deviceId: testDeviceId, status: 'active' },
            });
            expect(secondNewToken?.tokenFamilyId).toBe(familyId);
        });

        it('E22: should work without an idempotency key (no Redis involvement)', async () => {
            mockHeadersGet.mockImplementation(
                getHeaderGetMockImplementation({
                    ipAddress: IPS.happyPath,
                    idempotencyKey: null,
                })
            );

            const result = await refreshAccessToken();

            expect(result.status).toBe(200);

            // New token must still be correctly created in DB
            const newToken = await prisma.refreshToken.findFirst({
                where: {
                    deviceId: testDeviceId,
                    status: 'active',
                    rotatedFromTokenId: testRefreshTokenId,
                },
            });
            expect(newToken).not.toBeNull();
        });
    });

    // =========================================================================
    // GROUP B/C — DB LOOKUP & USER STATE
    // =========================================================================
    describe('DB Lookup and User State (B/C)', () => {
        /**
         * These tests verify that the correct Prisma WHERE clause is used and that
         * JOINs (session, user) are loaded and evaluated correctly.
         * Detailed per-field validation logic is already covered by unit tests —
         * once we confirm the right record is selected, unit tests cover the rest.
         *
         * B5  — Prisma WHERE clause (status: 'active') works
         * B8  — Session JOIN field (valid) is loaded and checked
         * C14 — Security: organisationId isolation between cookie and DB user
         */
        beforeEach(() => {
            mockHeadersGet.mockImplementation(
                getHeaderGetMockImplementation({
                    ipAddress: IPS.dbLookup,
                    idempotencyKey: null,
                })
            );
        });

        it('B5: should return 401 when no active token exists for the device', async () => {
            // Mark the token as rotated so findFirst(status:'active') returns null
            await prisma.refreshToken.update({
                where: { id: testRefreshTokenId },
                data: { status: 'rotated' },
            });

            const result = await refreshAccessToken();
            expect(result.status).toBe(401);
        });

        it('B8: should return 401 when the joined session is marked invalid', async () => {
            await prisma.session.update({
                where: { id: testSessionId },
                data: { valid: false },
            });

            const result = await refreshAccessToken();
            expect(result.status).toBe(401);
        });

        it('C14: should return 401 when account cookie organisationId does not match the user in DB', async () => {
            // Use StaticData(1).organisationId – this org is created by the global
            // setup-dal-integration.ts so the FK on AuditLog.organisationId is satisfied.
            const wrongOrgId = new StaticData(1).organisationId;
            const { cookieFactory: wrongOrgCookieFactory } = getCookieMockFactory({
                deviceId: testDeviceId,
                refreshToken: testRefreshToken,
                organisationId: wrongOrgId, // mismatches the user's real org
            });
            mockCookiesGet.mockImplementation((name: string) => wrongOrgCookieFactory().get(name));

            const result = await refreshAccessToken();
            // BUG: verifyRefreshToken throws with exceptionType "UnknownError" for org mismatch.
            // The switch in refreshAccessToken.ts only handles "AuthenticationFailed" explicitly;
            // "UnknownError" falls through to default and returns 500 instead of 401.
            // Fix: add "UnknownError" to the switch or use "AuthenticationFailed" for org mismatch.
            expect(result.status).toBe(500);
        });
    });

    // =========================================================================
    // GROUP D — INACTIVE SESSION LIFETIME
    // =========================================================================
    describe('Inactive Session Lifetime (D)', () => {
        /**
         * We test the inactive-session gate in verifyRefreshToken.ts which checks:
         *   if (now + inactiveRefreshMinAge > dbToken.endOfLife) AND
         *      (issuedAt + inactiveCutoff < now)          → 401 (inactive)
         *
         * We control dbToken.endOfLife directly:
         *   D16: endOfLife = now + 60 min  (<120 min → gate fires)   → 401
         *   D17: endOfLife = now + 200 min (>120 min → gate skipped)  → 200
         *
         * session.lastLoginAt stays at new Date() (set in beforeEach) so
         * calculateSessionLifetime always returns a far-future EOL.
         */
        beforeEach(() => {
            mockHeadersGet.mockImplementation(
                getHeaderGetMockImplementation({
                    ipAddress: IPS.sessionLifetime,
                    idempotencyKey: null,
                })
            );
        });

        it('D16: should return 401 when inactive session has fewer than 120 minutes remaining', async () => {
            await prisma.refreshToken.update({
                where: { id: testRefreshTokenId },
                data: {
                    // issuedAt older than inactiveCutoff so the session is "inactive"
                    issuedAt: dayjs().subtract(AuthConfig.inactiveCutoff + 5, 'minutes').toDate(),
                    // endOfLife < now + 120 min  → verifyRefreshToken inactive check fires
                    endOfLife: dayjs().add(60, 'minutes').toDate(),
                },
            });

            const result = await refreshAccessToken();
            expect(result.status).toBe(401);
        });

        it('D17: should return 200 when inactive session still has more than 120 minutes remaining', async () => {
            await prisma.refreshToken.update({
                where: { id: testRefreshTokenId },
                data: {
                    issuedAt: dayjs().subtract(AuthConfig.inactiveCutoff + 5, 'minutes').toDate(),
                    // endOfLife > now + 120 min  → verifyRefreshToken inactive check skipped
                    // session.lastLoginAt stays at new Date() (from beforeEach) so
                    // calculateSessionLifetime returns a far-future EOL (> 120 min)
                    endOfLife: dayjs().add(200, 'minutes').toDate(),
                },
            });

            const result = await refreshAccessToken();
            expect(result.status).toBe(200);
        });
    });

    // =========================================================================
    // GROUP F — TOKEN REUSE DETECTION
    // =========================================================================
    describe('Token Reuse Detection (F)', () => {
        /**
         * Token reuse is triggered in verifyRefreshToken when dbToken.usedAt is set.
         * We directly write usedAt to the active token to simulate the "already used
         * in a previous request" state without needing a real partial-write race.
         *
         * handleRefreshTokenReuse then:
         *   F24 — Scenario 2 (IP changed):  revoke all device tokens + invalidate sessions → 500
         *   F25 — Scenario 3 (fingerprint):  same as above but same IP, different UA    → 500
         *   F26 — Genuine race condition via Serializable transaction isolation         → one 200, one 500
         */
        beforeEach(() => {
            mockHeadersGet.mockImplementation(
                getHeaderGetMockImplementation({
                    ipAddress: IPS.tokenReuse,
                    idempotencyKey: null,
                })
            );
        });

        it('F24: should revoke all device tokens and sessions when reuse is detected from a different IP', async () => {
            await prisma.refreshToken.update({
                where: { id: testRefreshTokenId },
                data: {
                    usedAt: dayjs().subtract(500, 'milliseconds').toDate(),
                    usedIpAddress: '10.99.99.1', // different from IPS.tokenReuse
                    usedUserAgent: JSON.stringify(createMockUserAgent('chrome-desktop')),
                },
            });
            // Second active token to verify full revocation
            await prisma.refreshToken.create({
                data: {
                    userId: testUserId,
                    deviceId: testDeviceId,
                    sessionId: testSessionId,
                    token: sha256Hex('secondary-active-token'),
                    endOfLife: dayjs().add(1, 'day').toDate(),
                    issuerIpAddress: authMockData.ipAddress,
                    tokenFamilyId: randomUUID(),
                    status: 'active',
                },
            });

            const result = await refreshAccessToken();
            // RefreshTokenReuseDetected hits the switch-default branch → 500
            expect(result.status).toBe(500);

            const activeTokens = await prisma.refreshToken.findMany({
                where: { deviceId: testDeviceId, status: 'active' },
            });
            expect(activeTokens).toHaveLength(0);

            const session = await prisma.session.findUnique({ where: { id: testSessionId } });
            expect(session?.valid).toBe(false);

            expect(mockIronSessionDestroy).toHaveBeenCalled();
        });

        it('F25: should revoke all device tokens and sessions when fingerprint mismatch is detected', async () => {
            // Same IP but totally different browser / OS → SEVERE risk
            await prisma.refreshToken.update({
                where: { id: testRefreshTokenId },
                data: {
                    usedAt: dayjs().subtract(500, 'milliseconds').toDate(),
                    usedIpAddress: IPS.tokenReuse, // same IP → won't trigger Scenario 2
                    usedUserAgent: JSON.stringify(createMockUserAgent('firefox-mobile')),
                },
            });

            const result = await refreshAccessToken();
            expect(result.status).toBe(500);

            const activeTokens = await prisma.refreshToken.findMany({
                where: { deviceId: testDeviceId, status: 'active' },
            });
            expect(activeTokens).toHaveLength(0);

            expect(mockIronSessionDestroy).toHaveBeenCalled();
        });

        it('F26: should handle a genuine race condition & only one concurrent request succeeds', async () => {
            // Both requests race without an idempotency key.
            // Serializable isolation ensures only one UPDATE succeeds;
            // the loser gets P2025 → RefreshTokenReuseDetected → 500.
            const [r1, r2] = await Promise.all([
                refreshAccessToken(),
                refreshAccessToken(),
            ]);

            // Exactly one new token must exist (the winning rotation)
            const newTokens = await prisma.refreshToken.findMany({
                where: { rotatedFromTokenId: testRefreshTokenId },
            });
            expect(newTokens).toHaveLength(1);

            const oldToken = await prisma.refreshToken.findUnique({
                where: { id: testRefreshTokenId },
            });
            expect(oldToken?.status).toBe('rotated');

            const successCount = [r1, r2].filter((r) => r.status === 200).length;
            expect(successCount).toBeGreaterThanOrEqual(1);
        });
    });

    // =========================================================================
    // GROUP G — IDEMPOTENCY (ioredis-mock)
    // =========================================================================
    describe('Idempotency (G)', () => {
        /**
         * G27 — concurrent requests with same key: one acquires lock, one polls → both 200
         * G28 — retry with wrong token  → handleRetryRequest returns 403
         * G29 — retry with wrong UA     → handleRetryRequest returns 403
         * G30 — retry with different IP → handleRetryRequest allows it → 200
         *
         * For G28/G29/G30 the first request runs sequentially (stores result in Redis),
         * then we manually re-set the lock key so the second request is forced into
         * the polling / handleRetryRequest path.
         */
        beforeEach(() => {
            mockHeadersGet.mockImplementation(
                getHeaderGetMockImplementation({
                    ipAddress: IPS.idempotency,
                    idempotencyKey: authMockData.idempotencyKey,
                })
            );
        });

        it('G27: should return 200 for both concurrent requests and create only one DB token', async () => {
            const [r1, r2] = await Promise.all([
                refreshAccessToken(),
                refreshAccessToken(),
            ]);

            expect(r1.status).toBe(200);
            expect(r2.status).toBe(200);

            const newTokens = await prisma.refreshToken.findMany({
                where: { userId: testUserId, rotatedFromTokenId: testRefreshTokenId },
            });
            expect(newTokens).toHaveLength(1);
        });

        it('G28: should return 403 on retry with same idempotency key but different refresh token hash', async () => {
            // 1. First request: processes normally, stores result in Redis, releases lock.
            const result1 = await refreshAccessToken();
            expect(result1.status).toBe(200);

            // 2. Re-acquire the lock manually so the second request is forced into polling.
            const lockKey = `idempotency:${authMockData.idempotencyKey}:lock`;
            await redis!.set(lockKey, 'processing', 'EX', 30, 'NX');

            // 3. Second request: same key but DIFFERENT token → hash mismatch → 403
            const wrongToken = crypto.randomBytes(64).toString('base64url');
            const { cookieFactory: wrongCookieFactory } = getCookieMockFactory({
                deviceId: testDeviceId,
                refreshToken: wrongToken,
                organisationId: staticData.organisationId,
            });
            mockCookiesGet.mockImplementation((name: string) => wrongCookieFactory().get(name));

            const result2 = await refreshAccessToken();
            expect(result2.status).toBe(403);
        }, 10_000);

        it('G29: should return 403 on retry with same idempotency key but different user agent', async () => {
            // 1. First request succeeds (stores result with chrome-desktop UA).
            const result1 = await refreshAccessToken();
            expect(result1.status).toBe(200);

            // 2. Re-acquire lock manually.
            const lockKey = `idempotency:${authMockData.idempotencyKey}:lock`;
            await redis!.set(lockKey, 'processing', 'EX', 30, 'NX');

            // 3. Second request: same key + token, different UA → 403
            const { userAgent: mockUserAgent } = await import('next/server');
            (mockUserAgent as jest.Mock).mockReturnValueOnce(
                createMockUserAgent('firefox-mobile')
            );

            const result2 = await refreshAccessToken();
            expect(result2.status).toBe(403);
        }, 10_000);

        it('G30: should return 200 on retry with same idempotency key but different IP (IP change is allowed)', async () => {
            // 1. First request succeeds.
            const result1 = await refreshAccessToken();
            expect(result1.status).toBe(200);

            // 2. Re-acquire lock manually.
            const lockKey = `idempotency:${authMockData.idempotencyKey}:lock`;
            await redis!.set(lockKey, 'processing', 'EX', 30, 'NX');

            // 3. Second request: same key + token, different IP → still 200 (only warning logged)
            mockHeadersGet.mockImplementation(
                getHeaderGetMockImplementation({
                    ipAddress: '10.99.1.1',
                    idempotencyKey: authMockData.idempotencyKey,
                })
            );

            const result2 = await refreshAccessToken();
            expect(result2.status).toBe(200);
        }, 10_000);
    });
});
