import { Login } from './index';

const { mockUserFindFirst, mockOrgFindFirst, mockDeviceFindUnique } = vi.hoisted(() => ({
    mockUserFindFirst: vi.fn(),
    mockOrgFindFirst: vi.fn(),
    mockDeviceFindUnique: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
    prisma: {
        organisation: { findFirst: mockOrgFindFirst },
        user: { findFirst: mockUserFindFirst },
        device: { findUnique: mockDeviceFindUnique },
        $transaction: vi.fn((arr: Promise<unknown>[]) => Promise.all(arr)),
    },
}));

vi.mock('next/headers', () => ({
    headers: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue('192.168.1.1'),
    }),
    cookies: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
    }),
}));

vi.mock('next/server', () => ({
    userAgent: vi.fn().mockReturnValue({ ua: 'test-ua', browser: {}, device: {}, os: {}, engine: {}, cpu: {}, isBot: false }),
}));

vi.mock('timers/promises', () => ({
    setTimeout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('rate-limiter-flexible', () => ({
    RateLimiterMemory: class {
        get = vi.fn().mockResolvedValue(null);
        consume = vi.fn().mockResolvedValue({ remainingPoints: 10 });
    },
}));

vi.mock('@/lib/ironSession', () => ({
    getIronSession: vi.fn().mockResolvedValue({ destroy: vi.fn() }),
}));

vi.mock('../helper', () => ({
    getIPAddress: vi.fn().mockReturnValue('192.168.1.1'),
    logSecurityAuditEntry: vi.fn().mockResolvedValue(undefined),
    getDeviceAccountFromCookies: vi.fn().mockReturnValue({ account: null, accountCookie: null }),
    validateDeviceFingerprint: vi.fn(),
    RiskLevel: { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' },
}));

vi.mock('./verifyUser', () => ({
    verifyUser: vi.fn().mockResolvedValue({ mfaMethod: null }),
}));

vi.mock('./handleSuccessfulLogin', () => ({
    handleSuccessfulLogin: vi.fn().mockResolvedValue(undefined),
}));

const TEST_ORG_ID = '7f81af2e-a2e7-49f4-8fd9-fabb02666e89';
const TEST_USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const mockOrganisation = {
    id: TEST_ORG_ID,
    name: 'Test Org',
    acronym: 'org',
    useBeta: false,
};

const mockUser = {
    id: TEST_USER_ID,
    organisationId: TEST_ORG_ID,
    active: true,
    failedLoginCount: 0,
    recDelete: null,
    changePasswordOnLogin: false,
    role: 2,
    name: 'TestUser',
    username: 'testuser',
    email: 'testuser@example.com',
    lastLoginAt: null,
    password: 'hashed-password',
    twoFAEnabled: false,
    default2FAMethod: null,
    recDeleteUser: null,
};

const baseFormData = {
    organisationId: TEST_ORG_ID,
    password: 'password123',
};

afterEach(() => vi.clearAllMocks());

describe('Login – identifier routing', () => {
    beforeEach(() => {
        mockOrgFindFirst.mockResolvedValue(mockOrganisation);
        mockUserFindFirst.mockResolvedValue(mockUser);
        mockDeviceFindUnique.mockResolvedValue(null);
    });

    it('queries user by email when identifier contains @', async () => {
        const email = 'testuser@example.com';
        await Login({ ...baseFormData, identifier: email });

        expect(mockUserFindFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: { email, organisationId: TEST_ORG_ID },
        }));
    });

    it('queries user by username when identifier does not contain @', async () => {
        const username = 'testuser';
        await Login({ ...baseFormData, identifier: username });

        expect(mockUserFindFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: { username, organisationId: TEST_ORG_ID },
        }));
    });

    it('returns loginSuccessful: true for valid email login', async () => {
        const result = await Login({ ...baseFormData, identifier: 'testuser@example.com' });
        expect(result).toEqual({ loginSuccessful: true });
    });

    it('returns loginSuccessful: true for valid username login', async () => {
        const result = await Login({ ...baseFormData, identifier: 'testuser' });
        expect(result).toEqual({ loginSuccessful: true });
    });

    it('returns AuthenticationFailed when user not found by email', async () => {
        mockUserFindFirst.mockResolvedValue(null);
        const result = await Login({ ...baseFormData, identifier: 'noone@example.com' });
        expect(result).toEqual({ loginSuccessful: false, exceptionType: 'AuthenticationFailed' });
    });

    it('returns AuthenticationFailed when user not found by username', async () => {
        mockUserFindFirst.mockResolvedValue(null);
        const result = await Login({ ...baseFormData, identifier: 'nonexistent' });
        expect(result).toEqual({ loginSuccessful: false, exceptionType: 'AuthenticationFailed' });
    });
});
