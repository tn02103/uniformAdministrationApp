/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeviceIdsCookie, DeviceIdsCookieAccount, UserAgent, getDeviceAccountFromCookies, validateDeviceFingerprint } from "./helper";

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

            expect(result.riskLevel).toBe('SEVERE');
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

            expect(result.riskLevel).toBe('SEVERE');
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

            expect(result.riskLevel).toBe('SEVERE');
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

            expect(result.riskLevel).toBe('SEVERE');
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

            expect(result.riskLevel).toBe('SEVERE');
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

            expect(result.riskLevel).toBe('SEVERE');
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

            expect(result.riskLevel).toBe('HIGH');
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

            expect(result.riskLevel).toBe('HIGH');
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

            expect(result.riskLevel).toBe('MEDIUM');
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

            expect(result.riskLevel).toBe('MEDIUM');
            expect(result.reasons).toEqual(['IP address changed', 'Browser version updated']);
        });
    });

    describe('LOW risk scenarios', () => {
        it('should return LOW risk when everything matches perfectly', async () => {
            const result = await validateDeviceFingerprint({
                current: mockCurrent,
                expected: mockExpected,
            });

            expect(result.riskLevel).toBe('LOW');
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

            expect(result.riskLevel).toBe('LOW');
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

            expect(result.riskLevel).toBe('SEVERE'); // Should still work with partial data
            expect(result.reasons).toEqual(["Device type changed"]);
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

            expect(result.riskLevel).toBe('SEVERE');
            expect(result.reasons).toEqual(['Device type changed']);
        });
    });
});
