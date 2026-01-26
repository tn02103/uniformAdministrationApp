
// ########## CONFIG ##########
export const AuthConfig = {
    deviceCookie: process.env.AUTH_DEVICE_COOKIE_NAME ?? "deviceToken",
    refreshTokenCookie: process.env.AUTH_REFRESH_COOKIE_NAME ?? "refreshToken",
    accessToken: {
        age: 15 * 60,
        refreshInterval: 5 * 60,
        keepAliveCheckInterval: 60,
    },
    refreshTokenReuse: {
        acceptedTime: 1000,
        mediumRiskTime: 5000,
    },
    accessTokenAgeMinutes: 15,
    inactiveRefreshMinAge: 120, // Minimal restlifetime when refreshing an inactive session 
    inactiveCutoff: 30,
    sessionAgesInDays: {
        // In Days
        no2FA: 7,
        email2FA: 14,
        totp2FA: 30,
        newDevice: 3,
        requirePasswordReauth: 30,
        elevatedSessionInMin: {
            password: 10,
            mfa: 20,
        },
    }
};
