import type { DeviceIdsCookie, GetDeviceAccountFromCookiesReturn, UserAgent } from "../helper";
import { DBRefreshToken } from "../refresh/refreshAccessToken";
import dayjs from "@/lib/dayjs";
import { AuthConfig } from "../config";
import { cookies, headers } from "next/headers";
import { DeepPartial } from "react-hook-form";

// default mock data
export const getMockUserAgent = (overwrite: Partial<UserAgent> = {}): UserAgent => {
    return {
        browser: { name: 'Chrome', version: '120', major: '120', ...overwrite.browser },
        device: { type: 'desktop' as const, vendor: undefined, model: undefined, ...overwrite.device },
        os: { name: 'Windows', version: '10', ...overwrite.os },
        engine: { name: 'Blink', version: '120', ...overwrite.engine },
        cpu: { architecture: 'amd64', ...overwrite.cpu },
        ua: overwrite.ua ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0',
        isBot: overwrite.isBot !== undefined ? overwrite.isBot : false,
    }
}

export const authMockData = {
    deviceId: 'device-id-123',
    organisationId: 'org-id-123',
    sessionId: 'session-id-123',
    userId: 'user-id-123',
    refreshToken: 'refresh-token-xyz',
    refreshTokenId: 'token-id-123',
    userAgent: getMockUserAgent(),
    userAgentJsonString: JSON.stringify(getMockUserAgent()),
    ipAddress: '192.168.1.1',
    idempotencyKey: 'test-idempotency-key',
}


// Mock DB token
export const createMockDBToken = (overrides?: DeepPartial<DBRefreshToken>): DBRefreshToken => ({
    id: authMockData.refreshTokenId,
    status: 'active' as const,
    userId: authMockData.userId,
    token: authMockData.refreshToken,
    deviceId: authMockData.deviceId,
    sessionId: authMockData.sessionId,
    issuedAt: dayjs().subtract(10, 'minutes').toDate(),
    endOfLife: dayjs().add(7, 'days').toDate(),
    issuerIpAddress: authMockData.ipAddress,
    tokenFamilyId: 'family-id-123',
    usedAt: null,
    usedIpAddress: null,
    usedUserAgent: null,
    ...overrides,
    session: {
        id: authMockData.sessionId,
        deviceId: authMockData.deviceId,
        lastIpAddress: authMockData.ipAddress,
        sessionLifetime: dayjs().add(7, 'days').toDate(), // 7 days
        sessionRL: 'LOW',
        elevatedSessionTill: null,
        valid: true,
        userAgent: JSON.stringify(getMockUserAgent()),
        lastLoginAt: dayjs().subtract(1, 'day').toDate(),
        ...overrides?.session,
    },
    user: {
        id: authMockData.userId,
        organisationId: authMockData.organisationId,
        active: true,
        failedLoginCount: 0,
        recDelete: null,
        changePasswordOnLogin: false,
        role: 2,
        name: "TestUser",
        username: "teus",
        email: "testmail@example.com",
        lastLoginAt: null,
        password: "hashed-password",
        twoFAEnabled: false,
        default2FAMethod: null,
        recDeleteUser: null,
        ...overrides?.user,
        organisation: {
            id: authMockData.organisationId,
            name: 'Test Org',
            acronym: "org",
            useBeta: false,
            ...overrides?.user?.organisation,
        },
    },
    device: {
        id: authMockData.deviceId,
        userId: authMockData.userId,
        name: "TestDevice",
        description: "This is a test device",
        valid: true,
        lastIpAddress: authMockData.ipAddress,
        lastUsedAt: new Date(),
        lastMFAAt: dayjs().subtract(1, 'hour').toDate(),
        lastUsedMFAType: 'totp' as const,
        userAgent: JSON.stringify(getMockUserAgent()),
        createdAt: dayjs().subtract(30, 'days').toDate(),
        updatedAt: dayjs().subtract(20, 'days').toDate(),
        ...overrides?.device,
    },
    rotatedFromTokenId: null,
    numberOfUseAttempts: 0,
});


export const getDeviceAccountFromCookieReturnMock = (overwrites?: Partial<DeviceIdsCookie>): GetDeviceAccountFromCookiesReturn => {
    const account = {
        deviceId: authMockData.deviceId,
        organisationId: authMockData.organisationId,
        lastUsedAt: new Date().toISOString(),
        ...overwrites?.lastUsed,
    };
    return {
        account,
        accountCookie: {
            lastUsed: account,
            otherAccounts: overwrites?.otherAccounts ?? [],
        }
    }
};

type HeaderList = Awaited<ReturnType<typeof headers>>;
export const getHeaderGetMockImplementation = (overwrites?: HeaderOverwrites) => {
    return (name: string) => {
        switch (name) {
            case "true-client-ip":
            case "x-forwarded-for":
                return (overwrites?.ipAddress !== undefined) ? overwrites.ipAddress : authMockData.ipAddress;
            case "user-agent":
                return (overwrites?.ua !== undefined) ? overwrites.ua : authMockData.userAgent.ua;
            case "x-idempotency-key":
                return (overwrites?.idempotencyKey !== undefined) ? overwrites.idempotencyKey : authMockData.idempotencyKey;
            default:
                return null;
        }
    };
}

export const getNextHeaderMockFactory = () => {
    const header = {
        get: jest.fn(),
        set: jest.fn(),
        has: jest.fn(),
        delete: jest.fn(),
    }
    return {
        headerFactory: (overwrites?: { ipAddress?: string, ua?: string, idempotencyKey?: string }) => {
            header.get.mockImplementation(getHeaderGetMockImplementation(overwrites));
            return header as unknown as HeaderList;
        },
        mockHeaderInstance: header
    }

}
type HeaderOverwrites = {
    ipAddress?: string | null;
    ua?: string | null;
    idempotencyKey?: string | null;
}
export const getNextHeaderMock = (overwrites?: HeaderOverwrites): HeaderList => {
    return {
        get: jest.fn(getHeaderGetMockImplementation(overwrites)),
        set: jest.fn(),
        has: jest.fn(),
        delete: jest.fn(),
    } as unknown as HeaderList;
}

type CookieList = Awaited<ReturnType<typeof cookies>>;
export const getCookieMockFactory = (defaultValues: { deviceId: string, organisationId: string, refreshToken: string }) => {
    const { deviceId, organisationId, refreshToken } = defaultValues;
    const defaultDeviceCookie: DeviceIdsCookie = {
        lastUsed: {
            deviceId,
            organisationId,
            lastUsedAt: new Date().toISOString(),
        },
        otherAccounts: []
    };
    const mocks = {
        set: jest.fn(),
        has: jest.fn(),
        delete: jest.fn(),
        size: jest.fn(),
        getAll: jest.fn(),
        get: jest.fn(),
    }
    return {
        cookieFactory: (overwrites?: { refreshToken?: string | null; deviceCookie?: DeviceIdsCookie | null }) => {
            mocks.get.mockImplementation((name: string) => {
                switch (name) {
                    case AuthConfig.refreshTokenCookie:
                        if (overwrites?.refreshToken === null) {
                            return undefined;
                        }
                        return { name, value: overwrites?.refreshToken ?? refreshToken };
                    case AuthConfig.deviceCookie:
                        if (overwrites?.deviceCookie === null) {
                            return undefined;
                        }
                        return {
                            name,
                            value: JSON.stringify(overwrites?.deviceCookie ?? defaultDeviceCookie)
                        }
                    default:
                        return undefined;
                }
            });

            return mocks as unknown as CookieList;
        },
        mockCookieInstance: mocks,
    }
}
