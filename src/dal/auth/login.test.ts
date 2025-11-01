import { LoginFormType } from "@/zod/auth";
import { LogDebugLevel } from "./LogDebugLeve.enum";
import { Login } from "./login";
import { AuthenticationException } from "@/errors/Authentication";

const mocks = {
    ipAddress: '127.0.0.1',
    newAccessToken: 'newAccessToken',
    newRefreshToken: 'newRefreshToken',
    password: 'correctPassword',
    headers: "MockHeaders",
    userAgent: {
        isBot: false,
        ua: 'Mozilla/5.0',
        browser: { name: 'Chrome', version: '91.0.4472.124' },
        device: { model: undefined, type: undefined, vendor: undefined },
        engine: { name: 'Blink', version: '91.0.4472.124' },
        os: { name: 'Windows', version: '10' },
        cpu: { architecture: undefined }
    },
    user: {
        id: 'testUser',
        email: 'test@example.com',
        password: 'hashedPassword',
        active: true,
        recDelete: false,
        failedLoginCount: 0
    },
    organisation: {
        id: '84a3520e-ff76-4f6e-9b7f-e4d09100989a',
        name: 'Test Organisation'
    }
}

const mockProps: LoginFormType = {
    organisationId: mocks.organisation.id,
    email: 'test@example.com',
    password: 'correctPassword',
};
const mockPropsWithMFA: LoginFormType = {
    ...mockProps,
    secondFactor: {
        appId: 'fd31f806-bbb8-4010-8df5-5e4bf7e36927',
        token: '123456'
    }
}

const mockLogSecurityAuditEntryData = {
    success: false,
    ipAddress: mocks.ipAddress,
    action: "LOGIN_ATTEMPT",
    userAgent: mocks.userAgent,
    deviceId: 'existingDeviceId',
    organisationId: mockProps.organisationId,
    userId: mocks.user.id,
}

const mockLogSecurityAuditEntrySuccessData = {
    ...mockLogSecurityAuditEntryData,
    success: true,
    details: "Successful login",
    debugLevel: LogDebugLevel.SUCCESS,
    deviceId: "existingDeviceId",
}


jest.mock('./helper', () => {
    return {
        AuthConfig: { deviceCookie: "DeviceCookieName" },
        getIPAddress: jest.fn().mockImplementation(() => mocks.ipAddress),
        get2FARequiredForLogin: jest.fn().mockResolvedValue(false),
        getDeviceAccountFromCookies: jest.fn().mockReturnValue({ account: null, accountCookie: null }),
        getUser2FAConfig: jest.fn().mockResolvedValue({ enabled: false, method: null }),
        issueNewAccessToken: jest.fn().mockResolvedValue('newAccessToken'),
        issueNewRefreshToken: jest.fn().mockResolvedValue('newRefreshToken'),
        logSecurityAuditEntry: jest.fn().mockResolvedValue(undefined),
        verifyMFAToken: jest.fn().mockResolvedValue(undefined),
    }
});

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockImplementation(() => mocks.password),
    compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('next/headers', () => {
    const cookies = {
        set: jest.fn()
    }
    return {
        headers: jest.fn().mockImplementation(() => mocks.headers),
        cookies: jest.fn().mockReturnValue(cookies),
    }
});

jest.mock("next/server", () => ({
    userAgent: jest.fn().mockImplementation(() => mocks.userAgent),
}));

jest.mock("next/navigation", () => ({
    redirect: jest.fn().mockReturnValue({ loginSuccessful: true }),
    RedirectType: { push: 'push' }
}));

jest.mock("rate-limiter-flexible", () => {
    const RateLimiterMemoryInstance = {
        consume: jest.fn().mockResolvedValue({ remainingPoints: 5 }),
        get: jest.fn().mockResolvedValue({ remainingPoints: 5 }),
    };
    return {
        RateLimiterMemory: jest.fn().mockImplementation(() => RateLimiterMemoryInstance),
    }
});

jest.mock('@/lib/ironSession', () => {
    const ironSession = {
        destroy: jest.fn(),
        save: jest.fn(),
        userId: 'testUserId',
    }
    return {
        getIronSession: jest.fn().mockReturnValue(ironSession),
    }
});

jest.mock('@/lib/email/userBlockedEmail', () => ({
    sendUserBlockedEmail: jest.fn(),
}));

jest.mock('./email/verifyCode', () => ({
    __unsecuredSendEmailVerifyCode: jest.fn(),
}));

describe('Login DAL Tests', () => {
    const { prisma } = jest.requireMock('@/lib/db');
    const { RateLimiterMemory } = jest.requireMock('rate-limiter-flexible');
    const mockRateLimiterInstance = new RateLimiterMemory();
    const { logSecurityAuditEntry, verifyMFAToken, getUser2FAConfig, get2FARequiredForLogin, issueNewAccessToken, issueNewRefreshToken, getDeviceAccountFromCookies } = jest.requireMock('./helper');
    const bcrypt = jest.requireMock('bcrypt');
    const { sendUserBlockedEmail } = jest.requireMock('@/lib/email/userBlockedEmail');
    const { __unsecuredSendEmailVerifyCode } = jest.requireMock('./email/verifyCode');
    const ironSession = jest.requireMock("@/lib/ironSession").getIronSession();
    const cookies = jest.requireMock("next/headers").cookies();

    beforeEach(() => {
        jest.clearAllMocks();
        prisma.organisation.findFirst.mockResolvedValue(mocks.organisation);
        prisma.user.findFirst.mockResolvedValue(mocks.user);
        prisma.device.create.mockResolvedValue({ id: 'newDeviceId' });
        bcrypt.compare.mockResolvedValue(true);
        mockRateLimiterInstance.consume.mockResolvedValue({ remainingPoints: 5 });
        mockRateLimiterInstance.get.mockResolvedValue({ remainingPoints: 5 });
        getUser2FAConfig.mockResolvedValue({ enabled: false, method: null });
        get2FARequiredForLogin.mockResolvedValue(false);
        getDeviceAccountFromCookies.mockReturnValue({
            account: { deviceId: 'existingDeviceId' },
            accountCookie: { lastUsed: { deviceId: 'existingDeviceId' }, otherAccounts: [] }
        });
    });

    const expectNoTokenIssued = () => {
        expect(issueNewAccessToken).toHaveBeenCalledTimes(0);
        expect(issueNewRefreshToken).toHaveBeenCalledTimes(0);
        expect(ironSession.destroy).toHaveBeenCalledTimes(1);
    }

    describe('Login function', () => {
        it('should abort when ip-limit is hit', async () => {
            mockRateLimiterInstance.get.mockResolvedValue({ remainingPoints: 0 });
            const success = await Login(mockProps);
            expect(success).toStrictEqual({ loginSuccessful: false, exceptionType: 'TooManyRequests' });
            expect(mockRateLimiterInstance.consume).toHaveReturnedTimes(0);
            expectNoTokenIssued();
        });

        it('should handle exception from parsing formData', async () => {
            const success = await Login({ wrongProps: true } as unknown as LoginFormType);
            expect(success).toStrictEqual({ loginSuccessful: false, exceptionType: 'UnknownError' });
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledTimes(1);
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledWith(mocks.ipAddress, 2);
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith({
                ...mockLogSecurityAuditEntryData,
                details: "Props could not be passed via zod schema",
                debugLevel: LogDebugLevel.CRITICAL,
                organisationId: undefined,
                userId: undefined,
                deviceId: undefined,
            });
            expectNoTokenIssued();
        });

        it('should handle organisation not found', async () => {
            prisma.organisation.findFirst.mockResolvedValue(null);
            const success = await Login(mockProps);
            expect(success).toStrictEqual({ loginSuccessful: false, exceptionType: 'AuthenticationFailed' });
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledTimes(1);
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledWith(mocks.ipAddress, 5);
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith({
                ...mockLogSecurityAuditEntryData,
                details: `Failed login attempt: Organisation with id ${mocks.organisation.id} not found`,
                debugLevel: LogDebugLevel.WARNING,
                userId: undefined,
                organisationId: undefined,
                deviceId: undefined,
            });
            expectNoTokenIssued();
        });

        it('should handle user not found', async () => {
            prisma.user.findFirst.mockResolvedValue(null);
            const success = await Login(mockProps);
            expect(success).toStrictEqual({ loginSuccessful: false, exceptionType: 'AuthenticationFailed' });
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledTimes(1);
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledWith(mocks.ipAddress, 1);
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith({
                ...mockLogSecurityAuditEntryData,
                details: `Failed login attempt: User with email ${mocks.user.email} not found`,
                debugLevel: LogDebugLevel.INFO,
                userId: undefined,
            });
            expectNoTokenIssued();
        });

        it('should handle working login', async () => {
            const success = await Login(mockProps);
            expect(success).toStrictEqual({ loginSuccessful: true });
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledTimes(0);
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith(mockLogSecurityAuditEntrySuccessData);
        });
    });

    describe('verify User function', () => {
        it('should handle user deleted', async () => {
            prisma.user.findFirst.mockResolvedValue({ ...mocks.user, recDelete: new Date() });
            const success = await Login(mockProps);
            expect(success).toStrictEqual({ loginSuccessful: false, exceptionType: 'AuthenticationFailed' });
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledTimes(1);
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledWith(mocks.ipAddress, 1);
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith({
                ...mockLogSecurityAuditEntryData,
                details: "User has been deleted",
                debugLevel: LogDebugLevel.WARNING,
            });
            expectNoTokenIssued();
        });

        it('should handle user blocked', async () => {
            prisma.user.findFirst.mockResolvedValue({ ...mocks.user, active: false });
            const success = await Login(mockProps);
            expect(success).toStrictEqual({ loginSuccessful: false, exceptionType: 'User Blocked' });
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledTimes(1);
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledWith(mocks.ipAddress, 1);
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith({
                ...mockLogSecurityAuditEntryData,
                details: "User is blocked",
                debugLevel: LogDebugLevel.WARNING,
            });
            expectNoTokenIssued();
        });

        it('should handle wrong password without failed login count', async () => {
            bcrypt.compare.mockResolvedValue(false);
            prisma.user.update.mockResolvedValue({ ...mocks.user, failedLoginCount: 1 });
            const success = await Login(mockProps);
            expect(success).toStrictEqual({ loginSuccessful: false, exceptionType: 'AuthenticationFailed' });
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledTimes(1);
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledWith(mocks.ipAddress, 1);
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith({
                ...mockLogSecurityAuditEntryData,
                details: "Failed login attempt: Invalid password",
                debugLevel: LogDebugLevel.INFO,
            });
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: mocks.user.id },
                data: { failedLoginCount: { increment: 1 } },
            });
            expectNoTokenIssued();
        });
        it('should handle wrong password with blocking User', async () => {
            bcrypt.compare.mockResolvedValue(false);
            prisma.user.update.mockResolvedValue({ ...mocks.user, failedLoginCount: 10 });

            const success = await Login(mockProps);
            expect(success).toStrictEqual({ loginSuccessful: false, exceptionType: 'User Blocked' });

            expect(mockRateLimiterInstance.consume).toHaveBeenCalledTimes(1);
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledWith(mocks.ipAddress, 1);
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith({
                ...mockLogSecurityAuditEntryData,
                details: "User is now blocked due to too many failed login attempts",
                debugLevel: LogDebugLevel.WARNING,
            });
            expect(sendUserBlockedEmail).toHaveBeenCalledTimes(1);
            expect(sendUserBlockedEmail).toHaveBeenCalledWith(mocks.user.id);
            expectNoTokenIssued();

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: mocks.user.id },
                data: { failedLoginCount: { increment: 1 } },
            });
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: mocks.user.id },
                data: { active: false },
            });
            expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
                where: { userId: mocks.user.id },
                data: { revoked: true },
            });
        });

        it('should handle valid mfa Token', async () => {
            verifyMFAToken.mockResolvedValue(undefined);
            const success = await Login(mockPropsWithMFA);
            expect(success).toStrictEqual({ loginSuccessful: true });
            expect(verifyMFAToken).toHaveBeenCalledTimes(1);
            expect(verifyMFAToken).toHaveBeenCalledWith(mockPropsWithMFA.secondFactor?.token, mockPropsWithMFA.secondFactor?.appId, mockPropsWithMFA.organisationId, {
                ...mockLogSecurityAuditEntryData,
                action: undefined,
                success: undefined,
            });
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledTimes(0);
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith(mockLogSecurityAuditEntrySuccessData);
        });

        it('should handle exception from verifyMFAToken', async () => {
            verifyMFAToken.mockRejectedValue(new AuthenticationException('MFA verification error', "AuthenticationFailed", LogDebugLevel.WARNING, mockLogSecurityAuditEntryData));
            const success = await Login(mockPropsWithMFA);
            expect(success).toStrictEqual({ loginSuccessful: false, exceptionType: 'AuthenticationFailed' });
            expect(verifyMFAToken).toHaveBeenCalledTimes(1);
            expect(verifyMFAToken).toHaveBeenCalledWith(mockPropsWithMFA.secondFactor?.token, mockPropsWithMFA.secondFactor?.appId, mockPropsWithMFA.organisationId, {
                ...mockLogSecurityAuditEntryData,
                action: undefined,
                success: undefined,
            });
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledTimes(1);
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledWith(mocks.ipAddress, 1);
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith({
                ...mockLogSecurityAuditEntryData,
                details: "MFA verification error",
                debugLevel: LogDebugLevel.WARNING,
            });
            expectNoTokenIssued();
        });

        it('should handle mfa activated not required', async () => {
            getUser2FAConfig.mockResolvedValue({ enabled: true, method: 'totp' });
            get2FARequiredForLogin.mockResolvedValue(false);
            const success = Login(mockProps);
            await expect(success).resolves.toStrictEqual({ loginSuccessful: true });
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledTimes(0);
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith(mockLogSecurityAuditEntrySuccessData);
        });

        it('should handle mfa activated and required totp', async () => {
            getUser2FAConfig.mockResolvedValue({ enabled: true, method: 'totp' });
            get2FARequiredForLogin.mockResolvedValue(true);
            const success = Login(mockProps);
            await expect(success).resolves.toStrictEqual({ loginSuccessful: false, exceptionType: 'TwoFactorRequired', method: 'totp' });

            expect(mockRateLimiterInstance.consume).toHaveBeenCalledTimes(0);
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith({
                ...mockLogSecurityAuditEntryData,
                details: "Two factor authentication required",
                debugLevel: LogDebugLevel.SUCCESS,
            });
            expectNoTokenIssued();
        });

        it('should handle mfa activated and required email', async () => {
            getUser2FAConfig.mockResolvedValue({ enabled: true, method: 'email' });
            get2FARequiredForLogin.mockResolvedValue(true);
            const success = Login(mockProps);
            await expect(success).resolves.toStrictEqual({ loginSuccessful: false, exceptionType: 'TwoFactorRequired', method: 'email' });
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledTimes(0);
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(__unsecuredSendEmailVerifyCode).toHaveBeenCalledTimes(1);
            expect(__unsecuredSendEmailVerifyCode).toHaveBeenCalledWith(mockProps.organisationId, mocks.user.id);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith({
                ...mockLogSecurityAuditEntryData,
                details: "Two factor authentication required",
                debugLevel: LogDebugLevel.SUCCESS,
            });
            expectNoTokenIssued();
        });
    });


    describe('handleSuccessfulLogin functions', () => {
        it('should handle successful login correctly', async () => {
            const ironSession = await jest.requireMock('@/lib/ironSession').getIronSession();
            const cookieList = await jest.requireMock('next/headers').cookies();

            const success = await Login(mockProps);
            expect(success).toStrictEqual({ loginSuccessful: true });
            expect(issueNewAccessToken).toHaveBeenCalledTimes(1);
            expect(issueNewAccessToken).toHaveBeenCalledWith({
                organisation: mocks.organisation,
                session: ironSession,
                user: mocks.user
            });
            expect(issueNewRefreshToken).toHaveBeenCalledTimes(1);
            expect(issueNewRefreshToken).toHaveBeenCalledWith({
                cookieList,
                deviceId: "existingDeviceId",
                ipAddress: mocks.ipAddress,
                userId: mocks.user.id,
            });
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(1);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith(mockLogSecurityAuditEntrySuccessData);

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: mocks.user.id },
                data: { failedLoginCount: 0, lastLoginAt: expect.any(Date) }
            });
        });

        it('should handle device usage without existing device.', async () => {
            getDeviceAccountFromCookies.mockReturnValue({ account: null, accountCookie: null });
            const success = await Login(mockProps);
            expect(success).toStrictEqual({ loginSuccessful: true });
            expect(prisma.device.create).toHaveBeenCalledWith({
                data: {
                    userId: mocks.user.id,
                    last2FAAt: null,
                    lastIpAddress: mocks.ipAddress,
                    lastLoginAt: expect.any(Date),
                    lastUsedAt: expect.any(Date),
                    name: "Windows 10 - Chrome",
                    userAgent: JSON.stringify(mocks.userAgent),
                }
            });

            expect(cookies.set).toHaveBeenCalledWith(
                "DeviceCookieName",
                expect.any(String),
                { httpOnly: true, secure: true, sameSite: 'strict', path: '/' }
            );
        });

        it('should handle device usage with existing device.', async () => {
            const success = await Login(mockProps);
            expect(success).toStrictEqual({ loginSuccessful: true });
            expect(prisma.device.update).toHaveBeenCalledWith({
                where: { id: 'existingDeviceId' },
                data: {
                    lastIpAddress: mocks.ipAddress,
                    lastLoginAt: expect.any(Date),
                    lastUsedAt: expect.any(Date),
                    userAgent: JSON.stringify(mocks.userAgent),
                }
            });
            expect(cookies.set).toHaveBeenCalledWith(
                "DeviceCookieName",
                expect.any(String),
                { httpOnly: true, secure: true, sameSite: 'strict', path: '/' }
            );
        });
    });
    describe('ConsumeIPLimiter function', () => {
        it('should handle ipLimit hit correctly', async () => {
            prisma.user.findFirst.mockResolvedValue(null); // create error user not found
            mockRateLimiterInstance.consume.mockResolvedValue({ remainingPoints: 0 });
            const success = await Login(mockProps);
            expect(success).toStrictEqual({ loginSuccessful: false, exceptionType: 'AuthenticationFailed' });

            expect(mockRateLimiterInstance.consume).toHaveBeenCalledTimes(1);
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledWith(mocks.ipAddress, 1);
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(2);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith({
                ...mockLogSecurityAuditEntryData,
                userId: undefined,
                details: "IP temporarily blocked due to too many failed login attempts",
                debugLevel: LogDebugLevel.CRITICAL,
                organisationId: undefined,
            });
        });

        it('should handle ipLimit consume error correctly', async () => {
            prisma.user.findFirst.mockResolvedValue(null); // create error user not found
            mockRateLimiterInstance.consume.mockRejectedValue(new Error('Rate limiter error'));
            const success = await Login(mockProps);
            expect(success).toStrictEqual({ loginSuccessful: false, exceptionType: 'AuthenticationFailed' });
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledTimes(1);
            expect(mockRateLimiterInstance.consume).toHaveBeenCalledWith(mocks.ipAddress, 1);
            expect(logSecurityAuditEntry).toHaveBeenCalledTimes(2);
            expect(logSecurityAuditEntry).toHaveBeenCalledWith({
                ...mockLogSecurityAuditEntryData,
                userId: undefined,
                organisationId: undefined,
                details: "IP temporarily blocked due to too many failed login attempts",
                debugLevel: LogDebugLevel.CRITICAL,
            });
        });
    });
});
