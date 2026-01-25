import { prisma } from "@/lib/db";
import { staticData } from "../../../jest/setup-dal-integration";
import { issueNewRefreshToken, type UserAgent } from "./helper";
import { AuthConfig } from "./config";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import crypto from 'crypto';
import dayjs from "@/lib/dayjs";

// Simple mock for cookies - we only need the essential methods for our tests
const createMockCookies = () => {
    const cookies = new Map<string, { value: string; options?: object }>();
    
    const mockCookies = {
        get: (name: string) => {
            const cookie = cookies.get(name);
            return cookie ? { name, value: cookie.value } : undefined;
        },
        set: (name: string, value: string, options?: object) => {
            cookies.set(name, { value, options });
        },
        getCookieValue: (name: string) => cookies.get(name)?.value,
        getCookieOptions: (name: string) => cookies.get(name)?.options,
        // Add other required methods as no-ops
        getAll: () => [],
        has: (name: string) => cookies.has(name),
        [Symbol.iterator]: () => [][Symbol.iterator](),
        delete: () => {},
        size: 0,
    };
    
    return mockCookies as unknown as ReadonlyRequestCookies & {
        getCookieValue: (name: string) => string | undefined;
        getCookieOptions: (name: string) => object | undefined;
    };
};

describe('issueNewRefreshToken', () => {
    const mockUserAgent: UserAgent = {
        browser: { name: 'Chrome', version: '120.0.0.0' },
        os: { name: 'Windows', version: '10' },
        device: { type: 'desktop' },
        engine: { name: 'Blink', version: '120.0.0.0' },
        cpu: { architecture: 'amd64' },
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        isBot: false
    };

    beforeEach(async () => {
        await staticData.cleanup.user();
    });

    it('creates new token and sets it as cookie and saves it in DB', async () => {
        const mockCookies = createMockCookies();
        const userId = staticData.data.userIds[0]; // Admin user
        const deviceId = staticData.data.devices[0].id; // Admin desktop device
        const ipAddress = '192.168.1.100';
        const endOfLife = dayjs().add(5, 'days').toDate();

        expect(deviceId).toBeDefined(); // Make sure we have a valid deviceId

        // Get count of existing tokens before the operation
        const existingTokenCountBefore = await prisma.refreshToken.count({
            where: { userId, deviceId: deviceId! }
        });

        await issueNewRefreshToken({
            cookieList: mockCookies,
            userId,
            deviceId: deviceId!,
            ipAddress,
            endOfLife
        });

        // Verify token was created in database (should be one more than before)
        const refreshTokensAfter = await prisma.refreshToken.findMany({
            where: { userId, deviceId: deviceId! }
        });

        expect(refreshTokensAfter.length).toBe(existingTokenCountBefore + 1);
        
        // Find the newly created token by checking for the specific endOfLife date
        const savedToken = refreshTokensAfter.find(token => 
            token.endOfLife.getTime() === endOfLife.getTime()
        );
        
        expect(savedToken).toBeDefined();
        expect(savedToken!.userId).toBe(userId);
        expect(savedToken!.deviceId).toBe(deviceId!);
        expect(savedToken!.issuerIpAddress).toBe(ipAddress);
        expect(savedToken!.endOfLife).toEqual(endOfLife);
        expect(savedToken!.revoked).toBe(false);
        expect(savedToken!.usedAt).toBeNull();
        expect(savedToken!.token).toHaveLength(128); // 64 bytes hex = 128 characters

        // Verify cookie was set
        const cookieValue = mockCookies.getCookieValue(AuthConfig.refreshTokenCookie);
        const cookieOptions = mockCookies.getCookieOptions(AuthConfig.refreshTokenCookie) as { httpOnly?: boolean; secure?: boolean; sameSite?: string; expires?: Date };
        
        expect(cookieValue).toBe(savedToken!.token);
        expect(cookieOptions?.httpOnly).toBe(true);
        expect(cookieOptions?.secure).toBe(true);
        expect(cookieOptions?.sameSite).toBe('strict');
        expect(cookieOptions?.expires).toEqual(endOfLife);
    });

    it('if first generated token already exists in DB uses a different token', async () => {
        const mockCookies = createMockCookies();
        const userId = staticData.data.userIds[0];
        const deviceId = staticData.data.devices[0].id;
        const ipAddress = '192.168.1.100';

        expect(deviceId).toBeDefined();

        // Get an existing token from our static data
        const existingToken = staticData.data.refreshTokens[0].token;
        const newUniqueToken = 'a'.repeat(128); // Different unique token

        // Mock crypto.randomBytes to return existing token first, then unique token
        const mockRandomBytes = jest.spyOn(crypto, 'randomBytes');
        mockRandomBytes
            .mockImplementationOnce(() => Buffer.from(existingToken, 'hex'))
            .mockImplementationOnce(() => Buffer.from(newUniqueToken, 'hex'));

        // Get existing token count before the operation
        const existingTokenCount = await prisma.refreshToken.count({
            where: { userId, deviceId: deviceId! }
        });

        await issueNewRefreshToken({
            cookieList: mockCookies,
            userId,
            deviceId: deviceId!,
            ipAddress
        });

        // Verify crypto.randomBytes was called twice due to collision
        expect(mockRandomBytes).toHaveBeenCalledTimes(2);

        // Verify a new token was created
        const savedTokens = await prisma.refreshToken.findMany({
            where: { userId, deviceId: deviceId! }
        });

        expect(savedTokens.length).toBe(existingTokenCount + 1);
        
        // Find the newly created token (it should have the unique token we specified)
        const newToken = savedTokens.find(token => token.token === newUniqueToken);
        expect(newToken).toBeDefined();
        expect(newToken!.token).toBe(newUniqueToken);
        expect(newToken!.token).not.toBe(existingToken);

        mockRandomBytes.mockRestore();
    });

    it('invalidates all remaining unused tokens for user & device combination', async () => {
        const mockCookies = createMockCookies();
        const userId = staticData.data.userIds[0]; // Admin user
        const deviceId = staticData.data.devices[0].id; // Admin desktop device
        const ipAddress = '192.168.1.100';

        expect(deviceId).toBeDefined();

        // Create multiple active tokens for the same user-device combination  
        const existingTokens = [
            {
                token: 'token1' + 'a'.repeat(122), // exactly 128 chars
                userId,
                deviceId: deviceId!,
                endOfLife: dayjs().add(2, 'days').toDate(),
                revoked: false,
                issuerIpAddress: ipAddress,
                usedAt: null,
                usedIpAddress: null,
                usedUserAgent: null,
                numberOfUseAttempts: 0
            },
            {
                token: 'token2' + 'b'.repeat(122), // exactly 128 chars
                userId,
                deviceId: deviceId!,
                endOfLife: dayjs().add(3, 'days').toDate(),
                revoked: false,
                issuerIpAddress: ipAddress,
                usedAt: null,
                usedIpAddress: null,
                usedUserAgent: null,
                numberOfUseAttempts: 0
            }
        ];

        // Get count of existing active tokens before we add test tokens
        const initialExistingTokens = await prisma.refreshToken.findMany({
            where: { revoked: false }
        });
        const initialExistingCount = initialExistingTokens.length;

        await prisma.refreshToken.createMany({
            data: existingTokens
        });

        // Create tokens for different user/device (should not be affected)
        const otherUserId = staticData.data.userIds[1];
        const otherDeviceId = staticData.data.devices[2].id;
        
        expect(otherDeviceId).toBeDefined();

        const otherUserToken = {
            token: 'other_user_token' + 'c'.repeat(112), // exactly 128 chars (16 + 112)
            userId: otherUserId,
            deviceId: otherDeviceId!,
            endOfLife: dayjs().add(2, 'days').toDate(),
            revoked: false,
            issuerIpAddress: '192.168.1.101',
            usedAt: null,
            usedIpAddress: null,
            usedUserAgent: null,
            numberOfUseAttempts: 0
        };

        await prisma.refreshToken.create({
            data: otherUserToken
        });

        // Verify setup: should have initialExistingCount + 3 active tokens total 
        const currentActiveTokens = await prisma.refreshToken.findMany({
            where: { revoked: false }
        });
        expect(currentActiveTokens.length).toBe(initialExistingCount + 3);

        // Call issueNewRefreshToken
        await issueNewRefreshToken({
            cookieList: mockCookies,
            userId,
            deviceId: deviceId!,
            ipAddress
        });

        // Verify existing tokens for same user-device are revoked (including our test tokens + any existing static data)
        const revokedTokens = await prisma.refreshToken.findMany({
            where: { 
                userId, 
                deviceId: deviceId!,
                revoked: true 
            }
        });
        
        // Should have at least our 2 test tokens revoked, plus any existing static data tokens
        expect(revokedTokens.length).toBeGreaterThanOrEqual(2);
        
        // Specifically check that our test tokens were revoked
        const ourRevokedTokens = revokedTokens.filter(token => 
            token.token === existingTokens[0].token || token.token === existingTokens[1].token
        );
        expect(ourRevokedTokens).toHaveLength(2);

        // Verify new active token was created for same user-device
        const newActiveTokens = await prisma.refreshToken.findMany({
            where: { 
                userId, 
                deviceId: deviceId!,
                revoked: false,
                usedAt: null // Only count unused tokens
            }
        });
        expect(newActiveTokens).toHaveLength(1);

        // Verify other user's token is unaffected
        const otherUserTokenAfter = await prisma.refreshToken.findUnique({
            where: { token: otherUserToken.token }
        });
        expect(otherUserTokenAfter?.revoked).toBe(false);
    });

    it('marks used refresh token as used with userAgent if provided', async () => {
        const mockCookies = createMockCookies();
        const userId = staticData.data.userIds[0];
        const deviceId = staticData.data.devices[0].id;
        const ipAddress = '192.168.1.100';

        expect(deviceId).toBeDefined();

        // Create a token to be marked as used
        const usedTokenValue = 'token_to_be_used' + 'a'.repeat(112); // 16 + 112 = 128 chars exactly
        await prisma.refreshToken.create({
            data: {
                token: usedTokenValue,
                userId,
                deviceId: deviceId!,
                endOfLife: dayjs().add(2, 'days').toDate(),
                revoked: false,
                issuerIpAddress: ipAddress,
                usedAt: null,
                usedIpAddress: null,
                usedUserAgent: null,
                numberOfUseAttempts: 0
            }
        });

        const usedTokenValueFixed = usedTokenValue;

        const beforeTimestamp = new Date();

        await issueNewRefreshToken({
            cookieList: mockCookies,
            userId,
            deviceId: deviceId!,
            ipAddress,
            usedRefreshToken: usedTokenValueFixed,
            userAgent: mockUserAgent
        });

        const afterTimestamp = new Date();

        // Verify the used token was updated
        const usedToken = await prisma.refreshToken.findUnique({
            where: { token: usedTokenValueFixed }
        });

        expect(usedToken).toBeTruthy();
        expect(usedToken!.usedAt).toBeTruthy();
        expect(usedToken!.usedAt!.getTime()).toBeGreaterThanOrEqual(beforeTimestamp.getTime());
        expect(usedToken!.usedAt!.getTime()).toBeLessThanOrEqual(afterTimestamp.getTime());
        expect(usedToken!.usedIpAddress).toBe(ipAddress);
        expect(usedToken!.usedUserAgent).toBe(JSON.stringify(mockUserAgent));

        // Verify new token was created (count should be existing + 1, since we're invalidating and creating new)
        const newActiveTokens = await prisma.refreshToken.findMany({
            where: { 
                userId, 
                deviceId: deviceId!,
                revoked: false,
                usedAt: null // Only unused tokens
            }
        });
        expect(newActiveTokens.length).toBe(1); // Should have 1 unused active token (the new one)
    });

    it('works without usedRefreshToken parameter', async () => {
        const mockCookies = createMockCookies();
        const userId = staticData.data.userIds[0];
        const deviceId = staticData.data.devices[0].id;
        const ipAddress = '192.168.1.100';

        expect(deviceId).toBeDefined();

        // Get count of existing tokens before operation
        const existingTokenCount = await prisma.refreshToken.count({
            where: { userId, deviceId: deviceId! }
        });

        await issueNewRefreshToken({
            cookieList: mockCookies,
            userId,
            deviceId: deviceId!,
            ipAddress
        });

        // Should create new token normally without trying to mark any token as used
        const tokens = await prisma.refreshToken.findMany({
            where: { userId, deviceId: deviceId! }
        });

        expect(tokens.length).toBe(existingTokenCount + 1);
        
        // Find the newest token (the one we just created) - it should not be used
        const newestToken = tokens.find(token => 
            token.usedAt === null && 
            token.revoked === false && 
            token.issuerIpAddress === ipAddress
        );
        
        expect(newestToken).toBeDefined();
        expect(newestToken!.revoked).toBe(false);
        expect(newestToken!.usedAt).toBeNull();
    });
});
