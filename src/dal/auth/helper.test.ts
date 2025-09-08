/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeviceIdsCookie, DeviceIdsCookieAccount, UserAgent, getDeviceAccountFromCookies, handleRefreshTokenReuse, validateDeviceFingerprint } from "./helper";



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

    const mockDevice = {
        id: 'device-123',
        userAgent: JSON.stringify({
            os: { name: 'Windows', version: '10' },
            device: { type: 'desktop' },
            browser: { name: 'Chrome', version: '120.0.0.0' }
        })
    };

    const mockCurrentUA = createMockUserAgent();
    const mockIPAddress = '192.168.1.100';
    const mockCurrentIP = '192.168.1.100';
    const mockCurrentDeviceId = 'device-123';

    describe('SEVERE risk scenarios', () => {
        it('should return SEVERE risk when device ID mismatch occurs', async () => {
            const result = await validateDeviceFingerprint(
                mockIPAddress,
                mockDevice,
                'different-device-id', // Mismatched device ID
                mockCurrentIP,
                mockCurrentUA
            );

            expect(result.riskLevel).toBe('SEVERE');
            expect(result.reasons).toEqual(['Device ID mismatch']);
        });
        it('should return SEVERE risk when stored user agent is invalid JSON', async () => {
            const deviceWithInvalidUA = {
                ...mockDevice,
                userAgent: 'invalid-json-{malformed'
            };

            const result = await validateDeviceFingerprint(
                mockIPAddress,
                deviceWithInvalidUA,
                mockCurrentDeviceId,
                mockCurrentIP,
                mockCurrentUA
            );

            expect(result.riskLevel).toBe('SEVERE');
            expect(result.reasons).toContain('Invalid stored user agent');
        });

        it('should return SEVERE risk when OS name changes', async () => {
            const currentUAWithDifferentOS = createMockUserAgent({
                os: { name: 'macOS', version: '13' } // Changed from Windows to macOS
            });

            const result = await validateDeviceFingerprint(
                mockIPAddress,
                mockDevice,
                mockCurrentDeviceId,
                mockCurrentIP,
                currentUAWithDifferentOS
            );

            expect(result.riskLevel).toBe('SEVERE');
            expect(result.reasons).toEqual(['OS name changed']);
        });

        it('should return SEVERE risk when device type changes', async () => {
            const currentUAWithDifferentDeviceType = createMockUserAgent({
                device: { vendor: undefined, model: undefined, type: 'mobile' } // Changed from desktop to mobile
            });

            const result = await validateDeviceFingerprint(
                mockIPAddress,
                mockDevice,
                mockCurrentDeviceId,
                mockCurrentIP,
                currentUAWithDifferentDeviceType
            );

            expect(result.riskLevel).toBe('SEVERE');
            expect(result.reasons).toEqual(['Device type changed']);
        });

        it('should return SEVERE risk when browser name changes', async () => {
            const currentUAWithDifferentBrowser = createMockUserAgent({
                browser: { name: 'Firefox', version: '120.0.0.0', major: '120' } // Changed from Chrome to Firefox
            });

            const result = await validateDeviceFingerprint(
                mockIPAddress,
                mockDevice,
                mockCurrentDeviceId,
                mockCurrentIP,
                currentUAWithDifferentBrowser
            );

            expect(result.riskLevel).toBe('SEVERE');
            expect(result.reasons).toEqual(['Browser name changed']);
        });

        it('should return SEVERE risk when multiple critical properties change', async () => {
            const currentUAWithMultipleChanges = createMockUserAgent({
                os: { name: 'Linux', version: '22.04' }, // Changed OS
                device: { vendor: undefined, model: undefined, type: 'mobile' }, // Changed device type
                browser: { name: 'Safari', version: '16.0', major: '16' } // Changed browser
            });

            const result = await validateDeviceFingerprint(
                mockIPAddress,
                mockDevice,
                mockCurrentDeviceId,
                mockCurrentIP,
                currentUAWithMultipleChanges
            );

            expect(result.riskLevel).toBe('SEVERE');
            expect(result.reasons).toEqual(['OS name changed', 'Device type changed', 'Browser name changed']);
        });
    });

    describe('HIGH risk scenarios', () => {
        it('should return HIGH risk when OS version changes', async () => {
            const currentUAWithDifferentOSVersion = createMockUserAgent({
                os: { name: 'Windows', version: '11' } // Changed from version 10 to 11
            });

            const result = await validateDeviceFingerprint(
                mockIPAddress,
                mockDevice,
                mockCurrentDeviceId,
                mockCurrentIP,
                currentUAWithDifferentOSVersion
            );

            expect(result.riskLevel).toBe('HIGH');
            expect(result.reasons).toEqual(['OS version updated']);
        });

        it('should return HIGH risk when OS version changes with IP address change', async () => {
            const currentUAWithDifferentOSVersion = createMockUserAgent({
                os: { name: 'Windows', version: '11' }
            });

            const result = await validateDeviceFingerprint(
                mockIPAddress,
                mockDevice,
                mockCurrentDeviceId,
                '192.168.1.200', // Different IP
                currentUAWithDifferentOSVersion
            );

            expect(result.riskLevel).toBe('HIGH');
            expect(result.reasons).toEqual(['IP address changed', 'OS version updated']);
        });
    });

    describe('MEDIUM risk scenarios', () => {
        it('should return MEDIUM risk when browser version changes', async () => {
            const currentUAWithDifferentBrowserVersion = createMockUserAgent({
                browser: { name: 'Chrome', version: '121.0.0.0', major: '121' } // Updated browser version
            });

            const result = await validateDeviceFingerprint(
                mockIPAddress,
                mockDevice,
                mockCurrentDeviceId,
                mockCurrentIP,
                currentUAWithDifferentBrowserVersion
            );

            expect(result.riskLevel).toBe('MEDIUM');
            expect(result.reasons).toEqual(['Browser version updated']);
        });

        it('should return MEDIUM risk when browser version changes with IP address change', async () => {
            const currentUAWithDifferentBrowserVersion = createMockUserAgent({
                browser: { name: 'Chrome', version: '121.0.0.0', major: '121' }
            });

            const result = await validateDeviceFingerprint(
                mockIPAddress,
                mockDevice,
                mockCurrentDeviceId,
                '10.0.0.50', // Different IP
                currentUAWithDifferentBrowserVersion
            );

            expect(result.riskLevel).toBe('MEDIUM');
            expect(result.reasons).toEqual(['IP address changed', 'Browser version updated']);
        });
    });

    describe('LOW risk scenarios', () => {
        it('should return LOW risk when everything matches perfectly', async () => {
            const result = await validateDeviceFingerprint(
                mockIPAddress,
                mockDevice,
                mockCurrentDeviceId,
                mockCurrentIP,
                mockCurrentUA
            );

            expect(result.riskLevel).toBe('LOW');
            expect(result.reasons).toEqual([]);
        });

        it('should return LOW risk when only IP address changes', async () => {
            const result = await validateDeviceFingerprint(
                mockIPAddress,
                mockDevice,
                mockCurrentDeviceId,
                '203.0.113.50', // Different IP (mobile user scenario)
                mockCurrentUA
            );

            expect(result.riskLevel).toBe('LOW');
            expect(result.reasons).toEqual(['IP address changed']);
        });
    });

    describe('edge cases and malformed data', () => {
        it('should handle stored user agent with missing properties gracefully', async () => {
            const deviceWithIncompleteUA = {
                ...mockDevice,
                userAgent: JSON.stringify({
                    os: { name: 'Windows' }, // Missing version
                    // Missing device property entirely
                    browser: { name: 'Chrome' } // Missing version
                })
            };

            const result = await validateDeviceFingerprint(
                mockIPAddress,
                deviceWithIncompleteUA,
                mockCurrentDeviceId,
                mockCurrentIP,
                mockCurrentUA
            );

            expect(result.riskLevel).toBe('SEVERE'); // Should still work with partial data
            expect(result.reasons).toEqual(["Device type changed"]);
        });

        it('should handle current user agent with missing properties gracefully', async () => {
            const incompleteCurrentUA = createMockUserAgent({
                os: { name: 'Windows' }, // Missing version
                device: { vendor: undefined, model: undefined, type: undefined }, // Missing type
                browser: { name: 'Chrome', version: undefined, major: undefined } // Missing version
            });

            const result = await validateDeviceFingerprint(
                mockIPAddress,
                mockDevice,
                mockCurrentDeviceId,
                mockCurrentIP,
                incompleteCurrentUA
            );

            expect(result.riskLevel).toBe('SEVERE');
            expect(result.reasons).toEqual(['Device type changed']);
        });
    });
});

describe('handleRefreshTokenReuse', () => {
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

    const mockDeviceId = 'device-123';
    const mockIpAddress = '192.168.1.100';
    const mockUserAgent = createMockUserAgent();

    const createMockRefreshToken = (overrides?: any) => ({
        token: 'mock-refresh-token',
        userId: 'user-123',
        deviceId: mockDeviceId,
        endOfLife: new Date(Date.now() + 86400000), // 1 day from now
        revoked: false,
        issuerIpAddress: mockIpAddress,
        usedAt: new Date(Date.now() - 500), // 500ms ago
        usedIpAddress: mockIpAddress,
        usedUserAgent: JSON.stringify({
            os: { name: 'Windows', version: '10' },
            device: { type: 'desktop' },
            browser: { name: 'Chrome', version: '120.0.0.0' }
        }),
        numberOfUseAttempts: 1,
        ...overrides
    });

    const mockCurrentRequest = {
        deviceId: mockDeviceId,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent
    };

    it('should return CRITICAL risk when usedAt is null', async () => {
        const usedToken = createMockRefreshToken({
            usedAt: null
        });

        const result = await handleRefreshTokenReuse(usedToken, mockCurrentRequest);

        expect(result.action).toBe('INVALIDATE_ALL_SESSIONS');
        expect(result.reason).toBe('Missing token usage context - implementation error');
        expect(result.riskLevel).toBe('CRITICAL');
    });

    it('should return CRITICAL risk when usedIpAddress is null', async () => {
        const usedToken = createMockRefreshToken({
            usedIpAddress: null
        });

        const result = await handleRefreshTokenReuse(usedToken, mockCurrentRequest);

        expect(result.action).toBe('INVALIDATE_ALL_SESSIONS');
        expect(result.reason).toBe('Missing token usage context - implementation error');
        expect(result.riskLevel).toBe('CRITICAL');
    });

    it('should return CRITICAL risk when usedUserAgent is null', async () => {
        const usedToken = createMockRefreshToken({
            usedUserAgent: null
        });

        const result = await handleRefreshTokenReuse(usedToken, mockCurrentRequest);

        expect(result.action).toBe('INVALIDATE_ALL_SESSIONS');
        expect(result.reason).toBe('Missing token usage context - implementation error');
        expect(result.riskLevel).toBe('CRITICAL');
    });

    it('should ALLOW when low risk and within parallel window (same context)', async () => {
        // Create token that was used very recently (500ms ago) with same context
        const usedToken = createMockRefreshToken({
            usedAt: new Date(Date.now() - 500), // 500ms ago (within 1 second parallel window)
            usedIpAddress: mockIpAddress,
            usedUserAgent: JSON.stringify({
                os: { name: 'Windows', version: '10' },
                device: { type: 'desktop' },
                browser: { name: 'Chrome', version: '120.0.0.0' }
            })
        });

        const result = await handleRefreshTokenReuse(usedToken, mockCurrentRequest);

        expect(result.action).toBe('ALLOW');
        expect(result.reason).toBe('Likely parallel request from same context');
        expect(result.riskLevel).toBe('LOW');
    });

    it('should REQUIRE_REAUTH when low risk but not in parallel window but within low risk window', async () => {
        // Create token that was used 3 seconds ago (outside parallel window but within low risk window)
        const usedToken = createMockRefreshToken({
            usedAt: new Date(Date.now() - 3000), // 3 seconds ago (outside 1s parallel, within 5s low risk)
            usedIpAddress: mockIpAddress,
            usedUserAgent: JSON.stringify({
                os: { name: 'Windows', version: '10' },
                device: { type: 'desktop' },
                browser: { name: 'Chrome', version: '120.0.0.0' }
            })
        });

        const result = await handleRefreshTokenReuse(usedToken, mockCurrentRequest);

        expect(result.action).toBe('REQUIRE_REAUTH');
        expect(result.reason).toBe('Same device but not in parallel request window');
        expect(result.riskLevel).toBe('MEDIUM');
    });

    it('should INVALIDATE_ALL_SESSIONS when medium risk within parallel window (different IP)', async () => {
        // Create token with different IP but within parallel window
        const usedToken = createMockRefreshToken({
            usedAt: new Date(Date.now() - 500), // Within parallel window
            usedIpAddress: '10.0.0.1', // Different IP
            usedUserAgent: JSON.stringify({
                os: { name: 'Windows', version: '10' },
                device: { type: 'desktop' },
                browser: { name: 'Chrome', version: '120.0.0.0' }
            })
        });

        const result = await handleRefreshTokenReuse(usedToken, mockCurrentRequest);

        expect(result.action).toBe('INVALIDATE_ALL_SESSIONS');
        expect(result.reason).toBe('Refresh token reuse from different context - possible token theft');
        expect(result.riskLevel).toBe('CRITICAL');
    });

    it('should INVALIDATE_ALL_SESSIONS when high risk (different user agent)', async () => {
        // Create token with different user agent (browser changed)
        const usedToken = createMockRefreshToken({
            usedAt: new Date(Date.now() - 500), // Within parallel window
            usedIpAddress: mockIpAddress,
            usedUserAgent: JSON.stringify({
                os: { name: 'macOS', version: '13' }, // Different OS - high risk
                device: { type: 'desktop' },
                browser: { name: 'Chrome', version: '120.0.0.0' }
            })
        });

        const result = await handleRefreshTokenReuse(usedToken, mockCurrentRequest);

        expect(result.action).toBe('INVALIDATE_ALL_SESSIONS');
        expect(result.reason).toBe('Refresh token reuse from different context - possible token theft');
        expect(result.riskLevel).toBe('CRITICAL');
    });
});
