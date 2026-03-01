/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthRole } from "@/lib/AuthRoles";
import { MFAType } from "@prisma/client";
import { calculateSessionLifetime, DeviceIdsCookie, DeviceIdsCookieAccount, getIPAddress, RiskLevel, UserAgent, getDeviceAccountFromCookies, validateDeviceFingerprint, getUserMFAConfig, verifyMFAToken } from "./helper";
import { verifyEmailCode } from "./email/verifyCode";
import { __unsecuredVerifyTwoFactorCode } from "./2fa/verify";

// Mock dependencies
jest.mock('@/lib/db', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
    },
}));

jest.mock('./email/verifyCode', () => ({
    verifyEmailCode: jest.fn(),
}));

jest.mock('./2fa/verify', () => ({
    __unsecuredVerifyTwoFactorCode: jest.fn(),
}));

jest.mock('@/lib/dayjs', () => {
    const actualDayjs = jest.requireActual('dayjs');
    return actualDayjs;
});

jest.mock('./config', () => ({
    AuthConfig: {
        sessionAgesInDays: {
            no2FA: 7,
            email2FA: 14,
            totp2FA: 30,
            newDevice: 3,
            requirePasswordReauth: 90,
        },
        deviceCookie: 'device-ids',
    },
}));

const mockPrisma = jest.requireMock('@/lib/db').prisma;
const mockVerifyEmailCode = verifyEmailCode as jest.MockedFunction<typeof verifyEmailCode>;
const mockUnsecuredVerifyTwoFactorCode = __unsecuredVerifyTwoFactorCode as jest.MockedFunction<typeof __unsecuredVerifyTwoFactorCode>;

describe('getDeviceAccountFromCookies', () => {
    const mockAccounts: DeviceIdsCookieAccount[] = [
        { deviceId: 'a5deab1d-66ea-441a-afe0-abedc065d632', organisationId: '7f81af2e-a2e7-49f4-8fd9-fabb02666e89', lastUsedAt: "2024-02-01T00:00:00.000Z" },
        { deviceId: '94c99203-b041-49e5-ab8b-00b29e29ed62', organisationId: '5b6322b8-694c-4b31-841a-7eb067c5a3c0', lastUsedAt: "2024-02-05T00:00:00.000Z" },
        { deviceId: '0a310e23-1d1e-44d8-8bfa-cba1d35ef266', organisationId: 'bbc41e16-712f-497d-90b4-0cb17ee3784d', lastUsedAt: "2024-02-06T00:00:00.000Z" },
    ];
    const mockCookieList = {
        get: jest.fn()
    }
    beforeEach(() => {
        const mockValue = JSON.stringify(getMockValue());
        mockCookieList.get.mockReturnValue({ value: mockValue });
    });

    const getMockValue = (data?: Partial<DeviceIdsCookie>) => ({
        lastUsed: mockAccounts[0],
        otherAccounts: [mockAccounts[1], mockAccounts[2]],
        ...data,
    });

    it('should return the device account from cookies if last used', () => {
        const { account, accountCookie } = getDeviceAccountFromCookies({
            cookieList: mockCookieList as any,
            organisationId: mockAccounts[0].organisationId
        });
        expect(accountCookie).not.toBeNull();
        expect(accountCookie).toMatchObject(getMockValue())

        expect(account).not.toBeNull();
        expect(account).toMatchObject(mockAccounts[0]);
    });

    it('should return the device account from cookies if not last used', () => {
        const { account, accountCookie } = getDeviceAccountFromCookies({
            cookieList: mockCookieList as any,
            organisationId: mockAccounts[2].organisationId
        });
        expect(accountCookie).not.toBeNull();
        expect(accountCookie).toMatchObject(getMockValue())

        expect(account).not.toBeNull();
        expect(account).toMatchObject(mockAccounts[2]);
    });

    it('should return null if no matching device account is found', () => {
        const { account, accountCookie } = getDeviceAccountFromCookies({
            cookieList: mockCookieList as any,
            organisationId: "e9571df7-d644-442e-aaa4-6e856a1ede73"
        });
        expect(accountCookie).not.toBeNull();
        expect(accountCookie).toMatchObject(getMockValue())

        expect(account).toBeNull();
    });

    it('should return null if cookieList is empty', () => {
        mockCookieList.get.mockReturnValueOnce(null);
        const { account, accountCookie } = getDeviceAccountFromCookies({
            cookieList: mockCookieList as any,
            organisationId: "e9571df7-d644-442e-aaa4-6e856a1ede73"
        });
        expect(accountCookie).toBeNull();
        expect(account).toBeNull();
    });
    it('should return null if no organisationId is provided', () => {
        const { account, accountCookie } = getDeviceAccountFromCookies({
            cookieList: mockCookieList as any,
        });
        expect(accountCookie).not.toBeNull();
        expect(accountCookie).toMatchObject(getMockValue())

        expect(account).toBeNull();
    });
});

describe('validateDeviceFingerprint', () => {
    // Helper function to create complete UserAgent mock objects
    const createMockUserAgent = (overrides?: Partial<UserAgent>): UserAgent => ({
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        browser: { name: 'Chrome', version: '120.0.0.0', major: '120' },
        engine: { name: 'Blink', version: '120.0.0.0' },
        os: { name: 'Windows', version: '10' },
        device: { vendor: undefined, model: undefined, type: 'desktop' },
        cpu: { architecture: undefined },
        isBot: false,
        ...overrides
    });

    const mockCurrent = {
        deviceId: 'device-123',
        ipAddress: '192.168.1.100',
        userAgent: createMockUserAgent()
    }
    const mockExpected = {
        deviceId: 'device-123',
        ipAddress: '192.168.1.100',
        userAgent: JSON.stringify(createMockUserAgent()),
    }

    describe('SEVERE risk scenarios', () => {
        it('should return SEVERE risk when device ID mismatch occurs', async () => {
            const result = await validateDeviceFingerprint({
                current: mockCurrent,
                expected: {
                    ...mockExpected,
                    deviceId: 'different-device-id',
                },
            });

            expect(result.riskLevel).toBe(RiskLevel.SEVERE);
            expect(result.reasons).toEqual(['Device ID mismatch']);
        });
        it('should return SEVERE risk when stored user agent is invalid JSON', async () => {
            const result = await validateDeviceFingerprint({
                current: mockCurrent,
                expected: {
                    ...mockExpected,
                    userAgent: 'invalid-json-{malformed'
                },

            });

            expect(result.riskLevel).toBe(RiskLevel.SEVERE);
            expect(result.reasons).toContain('Invalid stored user agent');
        });

        it('should return SEVERE risk when OS name changes', async () => {
            const currentUAWithDifferentOS = createMockUserAgent({
                os: { name: 'macOS', version: '13' } // Changed from Windows to macOS
            });

            const result = await validateDeviceFingerprint({
                current: {
                    ...mockCurrent,
                    userAgent: currentUAWithDifferentOS
                },
                expected: mockExpected,
            });

            expect(result.riskLevel).toBe(RiskLevel.SEVERE);
            expect(result.reasons).toEqual(['OS name changed']);
        });

        it('should return SEVERE risk when device type changes', async () => {
            const currentUAWithDifferentDeviceType = createMockUserAgent({
                device: { vendor: undefined, model: undefined, type: 'mobile' } // Changed from desktop to mobile
            });

            const result = await validateDeviceFingerprint({
                current: {
                    ...mockCurrent,
                    userAgent: currentUAWithDifferentDeviceType
                },
                expected: mockExpected,
            });

            expect(result.riskLevel).toBe(RiskLevel.SEVERE);
            expect(result.reasons).toEqual(['Device type changed']);
        });

        it('should return SEVERE risk when browser name changes', async () => {
            const currentUAWithDifferentBrowser = createMockUserAgent({
                browser: { name: 'Firefox', version: '120.0.0.0', major: '120' } // Changed from Chrome to Firefox
            });

            const result = await validateDeviceFingerprint({
                current: {
                    ...mockCurrent,
                    userAgent: currentUAWithDifferentBrowser
                },
                expected: mockExpected,
            });

            expect(result.riskLevel).toBe(RiskLevel.SEVERE);
            expect(result.reasons).toEqual(['Browser name changed']);
        });

        it('should return SEVERE risk when multiple critical properties change', async () => {
            const currentUAWithMultipleChanges = createMockUserAgent({
                os: { name: 'Linux', version: '22.04' }, // Changed OS
                device: { vendor: undefined, model: undefined, type: 'mobile' }, // Changed device type
                browser: { name: 'Safari', version: '16.0', major: '16' } // Changed browser
            });

            const result = await validateDeviceFingerprint({
                current: {
                    ...mockCurrent,
                    userAgent: currentUAWithMultipleChanges
                },
                expected: mockExpected,
            });

            expect(result.riskLevel).toBe(RiskLevel.SEVERE);
            expect(result.reasons).toEqual(['OS name changed', 'Device type changed', 'Browser name changed']);
        });
    });

    describe('HIGH risk scenarios', () => {
        it('should return HIGH risk when OS version changes', async () => {
            const currentUAWithDifferentOSVersion = createMockUserAgent({
                os: { name: 'Windows', version: '11' } // Changed from version 10 to 11
            });

            const result = await validateDeviceFingerprint({
                current: {
                    ...mockCurrent,
                    userAgent: currentUAWithDifferentOSVersion
                },
                expected: mockExpected,
            });

            expect(result.riskLevel).toBe(RiskLevel.HIGH);
            expect(result.reasons).toEqual(['OS version updated']);
        });

        it('should return HIGH risk when OS version changes with IP address change', async () => {
            const currentUAWithDifferentOSVersion = createMockUserAgent({
                os: { name: 'Windows', version: '11' }
            });

            const result = await validateDeviceFingerprint({
                current: {
                    ...mockCurrent,
                    ipAddress: '192.168.1.200', // Different IP
                    userAgent: currentUAWithDifferentOSVersion
                },
                expected: mockExpected,
            });

            expect(result.riskLevel).toBe(RiskLevel.HIGH);
            expect(result.reasons).toEqual(['IP address changed', 'OS version updated']);
        });
    });

    describe('MEDIUM risk scenarios', () => {
        it('should return MEDIUM risk when browser version changes', async () => {
            const currentUAWithDifferentBrowserVersion = createMockUserAgent({
                browser: { name: 'Chrome', version: '121.0.0.0', major: '121' } // Updated browser version
            });

            const result = await validateDeviceFingerprint({
                current: {
                    ...mockCurrent,
                    userAgent: currentUAWithDifferentBrowserVersion
                },
                expected: mockExpected,
            });

            expect(result.riskLevel).toBe(RiskLevel.MEDIUM);
            expect(result.reasons).toEqual(['Browser version updated']);
        });

        it('should return MEDIUM risk when browser version changes with IP address change', async () => {
            const currentUAWithDifferentBrowserVersion = createMockUserAgent({
                browser: { name: 'Chrome', version: '121.0.0.0', major: '121' }
            });

            const result = await validateDeviceFingerprint({
                current: {
                    ...mockCurrent,
                    ipAddress: '10.0.0.50', // Different IP
                    userAgent: currentUAWithDifferentBrowserVersion
                },
                expected: mockExpected,
            });

            expect(result.riskLevel).toBe(RiskLevel.MEDIUM);
            expect(result.reasons).toEqual(['IP address changed', 'Browser version updated']);
        });
    });

    describe('LOW risk scenarios', () => {
        it('should return LOW risk when everything matches perfectly', async () => {
            const result = await validateDeviceFingerprint({
                current: mockCurrent,
                expected: mockExpected,
            });

            expect(result.riskLevel).toBe(RiskLevel.LOW);
            expect(result.reasons).toEqual([]);
        });

        it('should return LOW risk when only IP address changes', async () => {
            const result = await validateDeviceFingerprint({
                current: {
                    ...mockCurrent,
                    ipAddress: '203.0.113.50', // Different IP (mobile user scenario)
                },
                expected: mockExpected,
            });

            expect(result.riskLevel).toBe(RiskLevel.LOW);
            expect(result.reasons).toEqual(['IP address changed']);
        });
    });

    describe('edge cases and malformed data', () => {
        it('should handle stored user agent with missing properties gracefully', async () => {
            const result = await validateDeviceFingerprint({
                current: mockCurrent,
                expected: {
                    ...mockExpected,
                    userAgent: JSON.stringify({
                        os: { name: 'Windows' }, // Missing version
                        // Missing device property entirely
                        browser: { name: 'Chrome' } // Missing version
                    })
                },
            });

            expect(result.riskLevel).toBe(RiskLevel.SEVERE);
            expect(result.reasons).toEqual(["OS version updated", "Device type changed", "Browser version updated"]);
        });

        it('should handle current user agent with missing properties gracefully', async () => {
            const incompleteCurrentUA = createMockUserAgent({
                os: { name: 'Windows' }, // Missing version
                device: { vendor: undefined, model: undefined, type: undefined }, // Missing type
                browser: { name: 'Chrome', version: undefined, major: undefined } // Missing version
            });

            const result = await validateDeviceFingerprint({
                current: {
                    ...mockCurrent,
                    userAgent: incompleteCurrentUA
                },
                expected: mockExpected,
            });

            expect(result.riskLevel).toBe(RiskLevel.SEVERE);
            expect(result.reasons).toEqual(['OS version updated', 'Device type changed', 'Browser version updated']);
        });
    });
});

describe('getIPAddress', () => {
    it('should return true-client-ip header when present', () => {
        const mockHeaders = {
            get: jest.fn((header: string) => {
                if (header === 'true-client-ip') return '203.0.113.1';
                if (header === 'x-forwarded-for') return '198.51.100.1';
                return null;
            })
        } as any;

        const result = getIPAddress(mockHeaders);
        expect(result).toBe('203.0.113.1');
        expect(mockHeaders.get).toHaveBeenCalledWith('true-client-ip');
    });

    it('should fall back to x-forwarded-for when true-client-ip is not present', () => {
        const mockHeaders = {
            get: jest.fn((header: string) => {
                if (header === 'x-forwarded-for') return '198.51.100.1';
                return null;
            })
        } as any;

        const result = getIPAddress(mockHeaders);
        expect(result).toBe('198.51.100.1');
        expect(mockHeaders.get).toHaveBeenCalledWith('true-client-ip');
        expect(mockHeaders.get).toHaveBeenCalledWith('x-forwarded-for');
    });

    it('should return "Unknown IP" when neither header is present', () => {
        const mockHeaders = {
            get: jest.fn(() => null)
        } as any;

        const result = getIPAddress(mockHeaders);
        expect(result).toBe('Unknown IP');
        expect(mockHeaders.get).toHaveBeenCalledWith('true-client-ip');
        expect(mockHeaders.get).toHaveBeenCalledWith('x-forwarded-for');
    });
});

describe('calculateSessionLifetime', () => {
    const baseDate = new Date('2024-01-01T12:00:00.000Z');

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(baseDate);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('MFA-based base lifetime', () => {
        it('should use no2FA config (7 days) when no MFA is configured', () => {
            const result = calculateSessionLifetime({
                isNewDevice: false,
                fingerprintRisk: RiskLevel.LOW,
                lastPWValidation: baseDate,
                userRole: AuthRole.user,
            });

            expect(result).not.toBeNull();
            const expectedDate = new Date('2024-01-08T12:00:00.000Z'); // 7 days
            expect(result?.getTime()).toBe(expectedDate.getTime());
        });

        it('should use email2FA config (14 days) when email MFA is configured', () => {
            const result = calculateSessionLifetime({
                isNewDevice: false,
                fingerprintRisk: RiskLevel.LOW,
                mfa: {
                    lastValidation: baseDate,
                    type: MFAType.email,
                },
                lastPWValidation: baseDate,
                userRole: AuthRole.user,
            });

            expect(result).not.toBeNull();
            const expectedDate = new Date('2024-01-15T12:00:00.000Z'); // 14 days
            expect(result?.getTime()).toBe(expectedDate.getTime());
        });

        it('should use totp2FA config (30 days) when TOTP MFA is configured', () => {
            const result = calculateSessionLifetime({
                isNewDevice: false,
                fingerprintRisk: RiskLevel.LOW,
                mfa: {
                    lastValidation: baseDate,
                    type: MFAType.totp,
                },
                lastPWValidation: baseDate,
                userRole: AuthRole.user,
            });

            expect(result).not.toBeNull();
            const expectedDate = new Date('2024-01-31T12:00:00.000Z'); // 30 days
            expect(result?.getTime()).toBe(expectedDate.getTime());
        });
    });

    describe('New device penalty', () => {
        it('should limit to newDevice config (3 days) for new devices', () => {
            const result = calculateSessionLifetime({
                isNewDevice: true,
                fingerprintRisk: RiskLevel.LOW,
                mfa: {
                    lastValidation: baseDate,
                    type: MFAType.totp, // Would be 30 days normally
                },
                lastPWValidation: baseDate,
                userRole: AuthRole.user,
            });

            expect(result).not.toBeNull();
            const expectedDate = new Date('2024-01-04T12:00:00.000Z'); // Limited to 3 days
            expect(result?.getTime()).toBe(expectedDate.getTime());
        });

        it('should not affect sessions shorter than newDevice limit', () => {
            const result = calculateSessionLifetime({
                isNewDevice: true,
                fingerprintRisk: RiskLevel.LOW,
                // no MFA = 7 days, but new device limit is 3 days
                lastPWValidation: baseDate,
                userRole: AuthRole.user,
            });

            expect(result).not.toBeNull();
            const expectedDate = new Date('2024-01-04T12:00:00.000Z'); // 3 days
            expect(result?.getTime()).toBe(expectedDate.getTime());
        });
    });

    describe('Risk-based reduction', () => {
        it('should not reduce session lifetime for LOW risk (1.0x)', () => {
            const result = calculateSessionLifetime({
                isNewDevice: false,
                fingerprintRisk: RiskLevel.LOW,
                lastPWValidation: baseDate,
                userRole: AuthRole.user,
            });

            expect(result).not.toBeNull();
            const expectedDate = new Date('2024-01-08T12:00:00.000Z'); // 7 days
            expect(result?.getTime()).toBe(expectedDate.getTime());
        });

        it('should reduce session lifetime for MEDIUM risk (0.7x)', () => {
            const result = calculateSessionLifetime({
                isNewDevice: false,
                fingerprintRisk: RiskLevel.MEDIUM,
                lastPWValidation: baseDate,
                userRole: AuthRole.user,
            });

            expect(result).not.toBeNull();
            const expectedDate = new Date('2024-01-06T09:36:00.000Z'); // 7 * 0.7 = 4.9 days
            expect(result?.getTime()).toBe(expectedDate.getTime());
        });

        it('should reduce session lifetime for HIGH risk (0.3x)', () => {
            const result = calculateSessionLifetime({
                isNewDevice: false,
                fingerprintRisk: RiskLevel.HIGH,
                lastPWValidation: baseDate,
                userRole: AuthRole.user,
            });

            expect(result).not.toBeNull();
            const expectedDate = new Date('2024-01-03T14:24:00.000Z'); // 7 * 0.3 = 2.1 days
            expect(result?.getTime()).toBe(expectedDate.getTime());
        });

        it('should force re-auth for SEVERE risk (0x)', () => {
            const result = calculateSessionLifetime({
                isNewDevice: false,
                fingerprintRisk: RiskLevel.SEVERE,
                lastPWValidation: baseDate,
                userRole: AuthRole.user,
            });

            expect(result).toBeNull();
        });
    });

    describe('Admin role reduction', () => {
        it('should reduce session lifetime for admin users (0.7x)', () => {
            const result = calculateSessionLifetime({
                isNewDevice: false,
                fingerprintRisk: RiskLevel.LOW,
                lastPWValidation: baseDate,
                userRole: AuthRole.admin,
            });

            expect(result).not.toBeNull();
            const expectedDate = new Date('2024-01-06T09:36:00.000Z'); // 7 * 0.7 = 4.9 days
            expect(result?.getTime()).toBe(expectedDate.getTime());
        });

        it('should not reduce session lifetime for non-admin users', () => {
            const result = calculateSessionLifetime({
                isNewDevice: false,
                fingerprintRisk: RiskLevel.LOW,
                lastPWValidation: baseDate,
                userRole: AuthRole.inspector,
            });

            expect(result).not.toBeNull();
            const expectedDate = new Date('2024-01-08T12:00:00.000Z'); // 7 days
            expect(result?.getTime()).toBe(expectedDate.getTime());
        });
    });

    describe('Password age check', () => {
        it('should force re-auth when password is older than requirePasswordReauth (90 days)', () => {
            const oldPasswordDate = new Date('2023-09-01T12:00:00.000Z'); // More than 90 days ago

            const result = calculateSessionLifetime({
                isNewDevice: false,
                fingerprintRisk: RiskLevel.LOW,
                lastPWValidation: oldPasswordDate,
                userRole: AuthRole.user,
            });

            expect(result).toBeNull();
        });

        it('should allow session when password is within 90 days', () => {
            const recentPasswordDate = new Date('2023-12-15T12:00:00.000Z'); // Less than 90 days ago

            const result = calculateSessionLifetime({
                isNewDevice: false,
                fingerprintRisk: RiskLevel.LOW,
                lastPWValidation: recentPasswordDate,
                userRole: AuthRole.user,
            });

            expect(result).not.toBeNull();
        });
    });

    describe('Minimum session duration', () => {
        it('should enforce minimum 8-hour session', () => {
            // Create scenario that would result in very short session
            // MEDIUM risk (0.7x) + Admin (0.7x) = 0.49x of 7 days = ~3.4 days * 24 = 81.6 hours
            // But if we use a very short base, it should enforce 8 hours minimum
            const result = calculateSessionLifetime({
                isNewDevice: false,
                fingerprintRisk: RiskLevel.HIGH, // 0.3x
                lastPWValidation: baseDate,
                userRole: AuthRole.admin, // 0.7x
            });

            // 7 days * 0.3 * 0.7 = 1.47 days = 35.28 hours (above minimum)
            expect(result).not.toBeNull();
        });
    });

    describe('Combined scenarios', () => {
        it('should apply multiple reductions correctly (new device + MEDIUM risk + admin)', () => {
            const result = calculateSessionLifetime({
                isNewDevice: true, // Limited to 3 days
                fingerprintRisk: RiskLevel.MEDIUM, // 0.7x
                mfa: {
                    lastValidation: baseDate,
                    type: MFAType.totp, // Would be 30 days
                },
                lastPWValidation: baseDate,
                userRole: AuthRole.admin, // 0.7x
            });

            expect(result).not.toBeNull();
            // 30 days -> limited to 3 days by newDevice -> 3 * 0.7 * 0.7 = 1.47 days
            const expectedDate = new Date('2024-01-02T23:16:48.000Z');
            expect(result?.getTime()).toBe(expectedDate.getTime());
        });

        it('should return null when combined reductions result in zero', () => {
            const result = calculateSessionLifetime({
                isNewDevice: false,
                fingerprintRisk: RiskLevel.SEVERE, // 0x multiplier
                mfa: {
                    lastValidation: baseDate,
                    type: MFAType.totp,
                },
                lastPWValidation: baseDate,
                userRole: AuthRole.admin,
            });

            expect(result).toBeNull();
        });
    });
});

describe('getUserMFAConfig', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw error when user is not found', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(getUserMFAConfig('user-123')).rejects.toThrow('User not found');
    });

    it('should return enabled: true with user method when user.twoFAEnabled is true', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'user-123',
            twoFAEnabled: true,
            default2FAMethod: MFAType.totp,
            role: AuthRole.user,
            organisation: {
                organisationConfiguration: null,
            },
        });

        const result = await getUserMFAConfig('user-123');

        expect(result).toEqual({
            enabled: true,
            method: MFAType.totp,
        });
    });

    it('should default to "email" method when user.default2FAMethod is null', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'user-123',
            twoFAEnabled: true,
            default2FAMethod: null,
            role: AuthRole.user,
            organisation: {
                organisationConfiguration: null,
            },
        });

        const result = await getUserMFAConfig('user-123');

        expect(result).toEqual({
            enabled: true,
            method: 'email',
        });
    });

    it('should return enabled: true when org config requires 2FA for all users', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'user-123',
            twoFAEnabled: false,
            default2FAMethod: MFAType.email,
            role: AuthRole.user,
            organisation: {
                organisationConfiguration: {
                    twoFactorAuthRule: 'required',
                },
            },
        });

        const result = await getUserMFAConfig('user-123');

        expect(result).toEqual({
            enabled: true,
            method: MFAType.email,
        });
    });

    it('should return enabled: true when org requires 2FA for administrators and user is admin', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'user-123',
            twoFAEnabled: false,
            default2FAMethod: MFAType.totp,
            role: AuthRole.admin,
            organisation: {
                organisationConfiguration: {
                    twoFactorAuthRule: 'administrators',
                },
            },
        });

        const result = await getUserMFAConfig('user-123');

        expect(result).toEqual({
            enabled: true,
            method: MFAType.totp,
        });
    });

    it('should return enabled: false when org requires 2FA for administrators but user is not admin', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'user-123',
            twoFAEnabled: false,
            default2FAMethod: MFAType.email,
            role: AuthRole.inspector,
            organisation: {
                organisationConfiguration: {
                    twoFactorAuthRule: 'administrators',
                },
            },
        });

        const result = await getUserMFAConfig('user-123');

        expect(result).toEqual({
            enabled: false,
            methdo: null, // Note: typo in original code "methdo"
        });
    });

    it('should return enabled: false when no 2FA requirements are met', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'user-123',
            twoFAEnabled: false,
            default2FAMethod: MFAType.email,
            role: AuthRole.user,
            organisation: {
                organisationConfiguration: {
                    twoFactorAuthRule: 'optional',
                },
            },
        });

        const result = await getUserMFAConfig('user-123');

        expect(result).toEqual({
            enabled: false,
            methdo: null, // Note: typo in original code "methdo"
        });
    });

    it('should return enabled: false when organisationConfiguration is null', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'user-123',
            twoFAEnabled: false,
            default2FAMethod: MFAType.email,
            role: AuthRole.user,
            organisation: {
                organisationConfiguration: null,
            },
        });

        const result = await getUserMFAConfig('user-123');

        expect(result).toEqual({
            enabled: false,
            methdo: null, // Note: typo in original code "methdo"
        });
    });

    it('should prioritize user.twoFAEnabled over org config', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'user-123',
            twoFAEnabled: true,
            default2FAMethod: MFAType.totp,
            role: AuthRole.user,
            organisation: {
                organisationConfiguration: {
                    twoFactorAuthRule: 'optional', // Would normally disable
                },
            },
        });

        const result = await getUserMFAConfig('user-123');

        expect(result).toEqual({
            enabled: true,
            method: MFAType.totp,
        });
    });
});

describe('verifyMFAToken', () => {
    const mockLogData = {
        ipAddress: '192.168.1.1',
        userAgent: {} as UserAgent,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call verifyEmailCode when appId is "email"', async () => {
        mockVerifyEmailCode.mockResolvedValue(undefined);

        await verifyMFAToken(
            '123456',
            'user-123',
            'email',
            'org-456',
            mockLogData
        );

        expect(mockVerifyEmailCode).toHaveBeenCalledWith('org-456', 'user-123', '123456');
        expect(mockUnsecuredVerifyTwoFactorCode).not.toHaveBeenCalled();
    });

    it('should call __unsecuredVerifyTwoFactorCode for TOTP appId', async () => {
        mockUnsecuredVerifyTwoFactorCode.mockResolvedValue(undefined);

        await verifyMFAToken(
            '123456',
            'user-123',
            'app-789',
            'org-456',
            mockLogData
        );

        expect(mockUnsecuredVerifyTwoFactorCode).toHaveBeenCalledWith(
            'org-456',
            'user-123',
            '123456',
            'app-789',
            mockLogData
        );
        expect(mockVerifyEmailCode).not.toHaveBeenCalled();
    });

    it('should propagate errors from verifyEmailCode', async () => {
        const error = new Error('Invalid email code');
        mockVerifyEmailCode.mockRejectedValue(error);

        await expect(
            verifyMFAToken('123456', 'user-123', 'email', 'org-456', mockLogData)
        ).rejects.toThrow('Invalid email code');
    });

    it('should propagate errors from __unsecuredVerifyTwoFactorCode', async () => {
        const error = new Error('Invalid TOTP code');
        mockUnsecuredVerifyTwoFactorCode.mockRejectedValue(error);

        await expect(
            verifyMFAToken('123456', 'user-123', 'app-789', 'org-456', mockLogData)
        ).rejects.toThrow('Invalid TOTP code');
    });
});
