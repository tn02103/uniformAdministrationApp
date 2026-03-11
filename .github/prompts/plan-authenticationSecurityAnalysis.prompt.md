# Security Analysis of Authentication System

## ✅ Strong Points

1. **Token Rotation**: Proper refresh token rotation with family tracking
2. **Reuse Detection**: Multi-level risk assessment for token reuse
3. **Device Fingerprinting**: Good tracking of device characteristics
4. **Rate Limiting**: IP-based protection on both login and refresh
5. **Audit Logging**: Comprehensive security event tracking
6. **Progressive Security**: Risk-based MFA and session lifetimes

## 🚨 Critical Security Issues

### 1. Race Condition in Token Refresh (CRITICAL)

**Location**: `helper.tokens.ts` lines 81-104

```typescript
// Mark the used refresh token as used
oldToken = await prisma.refreshToken.update({
    where: {
        id: usedRefreshTokenId,
        userId: userId,
        status: "active",
        usedAt: null,  // ❌ This check is TOO LATE
    },
    data: { usedAt: new Date(), ... }
});

// Then later...
await prisma.refreshToken.updateMany({
    where: { deviceId, status: "active" },
    data: { status: "revoked" }
});
```

**Problem**: If two tabs refresh simultaneously (within ~100ms), both can pass the `usedAt: null` check before either writes. You'll have:
- Two tokens with `usedAt` set
- Both marked as rotated
- False positive reuse detection on next refresh

**Attack Vector**: An attacker could intentionally send parallel requests to bypass reuse detection.

**Fix Required**: Database-level locking or atomic operations.

### 2. Token Family Not Fully Utilized

**Location**: `handleReuse.ts` lines 38-61

You revoke tokens by `userId` (SEVERE) or `deviceId` (MEDIUM), but you track `tokenFamilyId` in the schema.

**Problem**: 
- If a user has 3 devices and token reuse happens on Device A, why revoke Device B and C?
- True reuse attacks should only affect the compromised token family
- Current implementation is too aggressive (user loses all sessions) or too lenient (attacker keeps other sessions)

**Recommendation**: Revoke by `tokenFamilyId` for targeted response.

### 3. Session Lifetime Recalculation Logic

**Location**: `refreshAccessToken.ts` lines 124-139

```typescript
const endOfLife = calculateSessionLifetime({
    lastPWValidation: session.lastLoginAt,  // ❌ Never updates
    mfa: (device.lastMFAAt && device.lastUsedMFAType) ? {
        lastValidation: device.lastMFAAt,    // ❌ Never updates
        type: device.lastUsedMFAType,
    } : undefined,
    fingerprintRisk: fingerprintValidation.riskLevel,
    userRole: dbToken.user.role,
    isNewDevice: false,  // ✅ Correct
});
```

**Problem**: You recalculate `endOfLife` on every refresh, but:
- `session.lastLoginAt` is only updated on actual login (password auth)
- `device.lastMFAAt` is only updated on actual MFA validation
- So EOL gets progressively shorter on each refresh, even for active users

**Scenario**:
1. User logs in with TOTP → gets 30-day session
2. 29 days later, refreshes token
3. `calculateSessionLifetime()` runs with `lastPWValidation: 29 days ago`
4. User suddenly has 1 day left instead of extending the session

**Expected Behavior**: Active sessions should maintain their lifetime or extend it. Only risk changes should reduce it.

### 4. Inactive Session Logic Confusion

**Location**: `refreshAccessToken.ts` lines 148-157

```typescript
if (dayjs().subtract(AuthConfig.inactiveCutoff, "minutes").isAfter(dbToken.issuedAt)) {
    // INACTIVE SESSION: EOL needs to be at least 4 hours
    if (dayjs().add(AuthConfig.inactiveRefreshMinAge, "hours").isAfter(endOfLife)) {
        throw new AuthenticationException(
            "Inactive Session: EOL is under 4 hours away. Reauth required",
            "AuthenticationFailed",
            LogDebugLevel.INFO,
            logData,
        );
    }
}
```

**Problem**: This checks if the token was issued >30 minutes ago, not if the session was inactive.

**Better Approach**: Track `session.lastActivityAt` and check:
```typescript
if (dayjs().subtract(30, "minutes").isAfter(session.lastActivityAt)) {
    // Session was truly inactive
}
```

### 5. Device Fingerprint Changes Are Inconsistent

**Location**: `helper.ts` lines 194-249

**Issues**:
- OS version change → `HIGH` risk (but OS auto-updates are normal)
- Browser version change → `MEDIUM` risk (but browsers auto-update constantly)
- IP change → No risk elevation (correct for mobile users)

**Result**: Users on Windows 11 or Chrome will constantly trigger elevated risk when their software updates, forcing unnecessary MFA.

**Recommendation**:
- Track **major version** changes only (`Chrome 120` → `Chrome 121` = OK, `Chrome 120` → `Firefox 100` = HIGH)
- Consider browser auto-update patterns (weekly updates are normal)
- OS version updates should be `MEDIUM` not `HIGH`

### 6. Refresh Token Reuse Time Windows (MAJOR VULNERABILITY)

**Location**: `handleReuse.ts` lines 109-118

```typescript
if (minutesSinceInitialUse > 15) return "SEVERE";
if (minutesSinceInitialUse > 5) return "MEDIUM";
return "LOW";
```

**Problem**: Your config defines `acceptedTime: 1000ms` and `mediumRiskTime: 5000ms` but you're checking **minutes**, not milliseconds!

**Current Logic**:
- Reuse within 5 minutes → LOW risk (just log it)
- 5-15 minutes → MEDIUM risk (revoke device)
- >15 minutes → SEVERE risk (revoke all sessions)

**Intended Logic** (based on config):
- Reuse within 1 second → LOW (legitimate race condition)
- 1-5 seconds → MEDIUM (suspicious timing)
- >5 seconds → SEVERE (clear attack)

This is a **major vulnerability** because true attacks within 5 minutes are treated as low risk!

### 7. Multiple Issues in User Blocking

**Location**: `verifyUser.ts` lines 34-52

```typescript
if (updatedUser.failedLoginCount >= 10) {
    await prisma.user.update({
        where: { id: user.id },
        data: { active: false }
    });
    await prisma.refreshToken.updateMany({
        where: { userId: user.id },
        data: { status: "revoked" }
    });
    await sendUserBlockedEmail(user.id);
    throw new AuthenticationException(...);
}
```

**Issues**:
a) **No notification before block**: User goes from 9 failed attempts to blocked without warning
b) **Sessions not invalidated**: You revoke tokens but not `session.valid = false`
c) **No unblock mechanism**: Once blocked, user can never self-recover
d) **Email timing attack**: The blocked email reveals the account exists

**Recommendations**:
- Send warning email at 5 and 8 failed attempts
- Invalidate sessions too
- Auto-unblock after 24 hours or provide admin/self-service unblock
- Rate limit email sending

### 8. Missing CSRF Protection on Refresh Endpoint

**Location**: `route.ts`

Your refresh token is in a cookie with `sameSite: 'strict'` ✅, but the endpoint has no additional CSRF protection.

**Attack**: An attacker could make a user's browser refresh tokens by embedding:
```html
<img src="https://yourapp.com/api/auth/refresh">
```

**Mitigation**: Since it's `POST` only and cookies are `sameSite: strict`, you're mostly protected, but consider:
- Adding Origin/Referer header validation
- Using a CSRF token in the request body
- Or checking the `Origin` header matches your domain

### 9. Prisma Schema Issues

**a) numberOfUseAttempts field is defined but never used**
```prisma
numberOfUseAttempts Int @default(0) @map("number_of_uses")
```
You never increment this. Should track reuse attempts?

**b) Session.sessionRL is string but should be enum**
```prisma
sessionRL String @map("session_rl") @db.Char(10)
```
You set it to `String(riskLevel)` or `"newDevice"`, but RiskLevel is an enum. Type safety issue.

**c) Missing indexes**
```prisma
RefreshToken:
  @@index([userId, status, deviceId])  // ❌ Missing for common queries
  @@index([tokenFamilyId])              // ❌ Missing for family revocation
Session:
  @@index([deviceId, valid])            // ❌ Missing for session lookups
```

### 10. Timing Attack Vulnerability

**Location**: `verifyRefreshToken.ts` line 24

```typescript
if (dbToken.token !== sendTokenHash) {
    throw new AuthenticationException(...);
}
```

Standard string comparison is vulnerable to timing attacks. Use:
```typescript
import crypto from 'crypto';
if (!crypto.timingSafeEqual(Buffer.from(dbToken.token), Buffer.from(sendTokenHash))) {
    // ...
}
```

## ⚠️ Medium-Priority Issues

11. **No device limit per user** - user could create unlimited devices
12. **Old sessions never cleaned up** - you mentioned keeping "some past inactive sessions"
13. **IP address storage issues** - IPv6 addresses need `@db.VarChar(45)` → should be `VARCHAR(45)` for IPv6
14. **Typo in helper.ts line 303**: `methdo` should be `method`
15. **Missing transaction boundaries** - token rotation should be atomic
16. **Access token has no jti/token ID** - can't selectively revoke access tokens
17. **No monitoring/alerting** - you log to audit but no real-time alerts for critical events

## 🎯 Priority Recommendations

### Immediate (Fix Now):
1. Fix token reuse time windows (minutes vs milliseconds)
2. Add database transaction to token refresh
3. Fix session lifetime recalculation logic
4. Add proper indexes to Prisma schema

### High Priority (This Week):
5. Implement token family-based revocation
6. Fix fingerprint risk levels for auto-updates
7. Add timing-safe token comparison
8. Track session activity properly

### Medium Priority (This Month):
9. Add session/device cleanup job
10. Improve user blocking UX
11. Add device limits
12. Add monitoring/alerting

## Discussion Points

1. **Token Family Revocation Strategy**: Should we revoke entire family or just the compromised branch?
2. **Session Lifetime Extension**: Should active sessions extend their lifetime or maintain original EOL?
3. **Device Fingerprint Tolerance**: How much change should we tolerate for auto-updates?
4. **Inactive Session Handling**: Confirm the 4-hour minimum lifetime requirement for reactivation
5. **Race Condition Fix**: Use database locks, optimistic locking, or Redis for coordination?
