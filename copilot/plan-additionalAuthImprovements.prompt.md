````prompt
# Additional Auth Security Improvements

## Context

**Scope**: Security fixes and improvements for authentication system excluding refresh token rotation (handled in separate plan).

**Current Architecture**:
- PostgreSQL database with Prisma ORM
- Next.js API routes
- Rate limiting with `rate-limiter-flexible`
- Session-based auth with iron-session

**Key Files**:
- `src/dal/auth/refresh/verifyRefreshToken.ts` - Token validation
- `src/dal/auth/helper.ts` - Session lifetime calculation
- `src/dal/auth/login/index.ts` - Login with rate limiting
- `src/dal/auth/rateLimiter.ts` - Rate limiter abstraction (to create)
- `prisma/schema.prisma` - Database schema

---

## Task 2: Fix Timing Attack on Hash Comparison

**Issue**: String comparison vulnerable to timing attacks - attacker can measure time to guess token bytes.

**Goal**: Use constant-time comparison.

### Implementation

**File**: `src/dal/auth/refresh/verifyRefreshToken.ts` (line ~24)

**Change**:
```typescript
// Current (VULNERABLE):
if (dbToken.token !== sendTokenHash) {
    throw new AuthenticationException("Token hash mismatch", ...);
}

// Fixed (SECURE):
import crypto from 'crypto';

const dbTokenBuffer = Buffer.from(dbToken.token, 'hex');
const sendTokenBuffer = Buffer.from(sendTokenHash, 'hex');

if (dbTokenBuffer.length !== sendTokenBuffer.length || 
    !crypto.timingSafeEqual(dbTokenBuffer, sendTokenBuffer)) {
    throw new AuthenticationException(
        "Refresh token hash does not match",
        "AuthenticationFailed",
        LogDebugLevel.WARNING,
        logData
    );
}
```

**Key Points**:
- `crypto.timingSafeEqual()` takes constant time regardless of where strings differ
- Must check length first (timingSafeEqual requires equal-length buffers)
- Convert hex strings to buffers for comparison

### Testing

- [ ] Valid token → succeeds
- [ ] Invalid token → fails
- [ ] Measure timing for multiple invalid tokens → similar times

---

## Task 3: Fix Session Lifetime Issues

**Issue**: Session EOL recalculates on every refresh, getting progressively shorter even for active users.

**Goal**: Store original EOL, only reduce on risk increase.

### 3.1 Add Database Fields

**File**: `prisma/schema.prisma`

**Changes**:

```prisma
model Session {
    id                  String         @id @default(dbgenerated("gen_random_uuid()")) @db.Char(36)
    deviceId            String         @map("device_id") @db.Char(36)
    device              Device         @relation(fields: [deviceId], references: [id])
    valid               Boolean        @default(true)
    sessionLifetime     DateTime?      @map("session_lifetime") @db.Timestamp(3)
    sessionRL           SessionRiskLevel @map("session_rl")  // Changed from String
    sessionEOL          DateTime?      @map("session_eol") @db.Timestamp(3)  // NEW
    lastLoginAt         DateTime       @map("last_login_at") @db.Timestamp(3)
    lastIpAddress       String         @map("last_ip_address") @db.VarChar(45)
    userAgent           String         @map("user_agent") @db.Text
    elevatedSessionTill DateTime?      @map("elevated_session_till") @db.Timestamp(0)
    refreshTokens       RefreshToken[]

    @@schema("authentication")
}

// NEW enum for session risk level
enum SessionRiskLevel {
    LOW
    MEDIUM
    HIGH
    SEVERE
    NEW_DEVICE
    
    @@map("session_risk_level")
    @@schema("authentication")
}
```

**Migration Steps**:
```bash
npx prisma migrate dev --name add_session_eol_and_fix_risk_enum
npx prisma generate
```

### 3.2 Update Session Creation

**File**: `src/dal/auth/login/handleSuccessfulLogin.ts`

**Changes** (around line 130-160):

```typescript
// When creating new session
session = await prisma.session.create({
    data: {
        deviceId: dbDevice.id,
        valid: true,
        userAgent: JSON.stringify(userAgent),
        lastLoginAt: new Date(),
        sessionRL: isNewDevice ? SessionRiskLevel.NEW_DEVICE : SessionRiskLevel[riskLevel],
        sessionEOL: sessionEOL,  // NEW: Store calculated EOL
        lastIpAddress: ipAddress,
    }
});

// When updating existing session
session = await prisma.session.update({
    where: { id: activeSession.id },
    data: {
        userAgent: JSON.stringify(userAgent),
        lastLoginAt: new Date(),
        sessionRL: SessionRiskLevel[riskLevel],
        sessionEOL: sessionEOL,  // NEW: Update EOL
        lastIpAddress: ipAddress,
    }
});
```

### 3.3 Update Token Refresh Logic

**File**: `src/dal/auth/refresh/refreshAccessToken.ts` (lines 124-157)

**Changes**:

```typescript
// Get stored EOL instead of recalculating
let endOfLife = dbToken.session.sessionEOL;

if (!endOfLife) {
    // Fallback for old sessions without EOL (migration period)
    endOfLife = calculateSessionLifetime({
        lastPWValidation: session.lastLoginAt,
        mfa: (device.lastMFAAt && device.lastUsedMFAType) ? {
            lastValidation: device.lastMFAAt,
            type: device.lastUsedMFAType,
        } : undefined,
        fingerprintRisk: fingerprintValidation.riskLevel,
        userRole: dbToken.user.role,
        isNewDevice: false,
    });
    
    // Store it for next time
    await prisma.session.update({
        where: { id: dbToken.sessionId },
        data: { sessionEOL: endOfLife }
    });
}

// Only reduce EOL if risk increased
if (fingerprintValidation.riskLevel > RiskLevel.LOW) {
    const reducedEOL = calculateSessionLifetime({
        lastPWValidation: session.lastLoginAt,
        mfa: (device.lastMFAAt && device.lastUsedMFAType) ? {
            lastValidation: device.lastMFAAt,
            type: device.lastUsedMFAType,
        } : undefined,
        fingerprintRisk: fingerprintValidation.riskLevel,
        userRole: dbToken.user.role,
        isNewDevice: false,
    });
    
    if (reducedEOL && reducedEOL < endOfLife) {
        endOfLife = reducedEOL;
        await prisma.session.update({
            where: { id: dbToken.sessionId },
            data: { sessionEOL: endOfLife }
        });
    }
}

// Check inactive session logic (now uses stored EOL)
if (dayjs().subtract(AuthConfig.inactiveCutoff, "minutes").isAfter(dbToken.issuedAt)) {
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

**Key Points**:
- Use stored `sessionEOL` from database
- Only recalculate if risk increases
- Fallback for sessions without EOL (migration period)
- Inactive session check uses stored EOL

### Testing

- [ ] Login → check `sessionEOL` is set in DB
- [ ] Refresh after 1 day → verify EOL unchanged
- [ ] Trigger risk increase (change UA) → verify EOL reduced
- [ ] Old sessions without EOL → verify fallback works
- [ ] Inactive session check → verify 4-hour minimum

---

## Task 4: Update Rate Limiter to Support Redis

**Issue**: Current `RateLimiterMemory` is per-pod, allowing users to bypass limits by hitting different pods.

**Goal**: Support Redis-backed rate limiting with graceful fallback.

### Implementation

**New File**: `src/dal/auth/redis.ts`

```typescript
import Redis from 'ioredis';

let redis: Redis | null = null;

if (process.env.REDIS_HOST) {
    redis = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        lazyConnect: true,
    });
    
    redis.on('error', (error) => {
        console.warn('Redis connection error:', error.message);
    });
}

export const isRedisAvailable = () => redis?.status === 'ready';
export { redis };
```

**New File**: `src/dal/auth/rateLimiter.ts`

```typescript
import { RateLimiterMemory, RateLimiterRedis, RateLimiterAbstract } from 'rate-limiter-flexible';
import { redis, isRedisAvailable } from './redis';

type RateLimiterOptions = {
    points: number;
    duration: number;
};

export function createRateLimiter(options: RateLimiterOptions): RateLimiterAbstract {
    if (isRedisAvailable()) {
        console.log('Using Redis-backed rate limiter (cluster-wide)');
        return new RateLimiterRedis({
            storeClient: redis!,
            keyPrefix: 'rl:',
            points: options.points,
            duration: options.duration,
        });
    }
    
    console.log('Using in-memory rate limiter (single instance)');
    return new RateLimiterMemory({
        points: options.points,
        duration: options.duration,
    });
}
```

**File**: `src/dal/auth/login/index.ts`

**Change**:
```typescript
// Replace
import { RateLimiterMemory } from 'rate-limiter-flexible';

const ipLimiter = new RateLimiterMemory({
    points: 15,
    duration: 60 * 5,
});

// With
import { createRateLimiter } from '../rateLimiter';

const ipLimiter = createRateLimiter({
    points: 15,
    duration: 60 * 5,
});

// consumeIpLimiter stays the same
```

**File**: `src/dal/auth/refresh/refreshAccessToken.ts`

**Same changes**:
```typescript
import { createRateLimiter } from '../rateLimiter';

const ipLimiter = createRateLimiter({
    points: 15,
    duration: 60 * 15,
});
```

**Environment**:
```env
# .env.local (dev - no Redis)
# REDIS_HOST not set

# .env.production
REDIS_HOST=redis.internal
REDIS_PORT=6379
REDIS_PASSWORD=secure-password
```

**Key Points**:
- Graceful fallback to in-memory if no Redis
- Same API (`consume()`, `get()`, etc.)
- Minimal code changes
- Cluster-wide rate limiting in production

### Testing

- [ ] Without Redis → uses `RateLimiterMemory`
- [ ] Start Redis → uses `RateLimiterRedis`
- [ ] Hit rate limit → properly blocked
- [ ] Multiple pods → limits apply cluster-wide
- [ ] Redis fails → falls back to memory

---

## Task 5: Database Improvements

**Issue**: Missing indexes, unused field, typo in helper.

**Goal**: Optimize queries and clean up schema.

### 5.1 Add Performance Indexes

**File**: `prisma/schema.prisma`

**Add indexes**:
```prisma
model RefreshToken {
    // ... existing fields
    
    @@unique([token])
    @@unique([rotatedFromTokenId])
    @@index([userId])
    @@index([userId, status, deviceId])  // NEW
    @@index([tokenFamilyId])              // NEW
    @@index([sessionId])                  // NEW
    @@map("refresh_token")
    @@schema("authentication")
}

model Session {
    // ... existing fields
    
    @@index([deviceId, valid])  // NEW
    @@schema("authentication")
}
```

**Migration**:
```bash
npx prisma migrate dev --name add_performance_indexes
```

### 5.2 Fix Typo in helper.ts

**File**: `src/dal/auth/helper.ts` (line ~303)

**Change**:
```typescript
// Current (typo):
return { enabled: false, methdo: null };

// Fixed:
return { enabled: false, method: null };
```

### 5.3 Document Unused Field

**File**: `prisma/schema.prisma`

The `numberOfUseAttempts` field in `RefreshToken` is defined but never used. Add comment:

```prisma
model RefreshToken {
    // ... other fields
    numberOfUseAttempts Int @default(0) @map("number_of_uses")  // TODO: Implement reuse attempt tracking
}
```

**Decision needed**: Either implement this or remove in future migration.

### Testing

- [ ] Migrations run successfully
- [ ] Check indexes exist: `\d+ refresh_token` in psql
- [ ] Query performance improved (use EXPLAIN)
- [ ] Typo fix: TypeScript compiles

---

## Task 6: Unit Testing

**Goal**: Comprehensive test coverage for auth flows.

### Test Files to Create

**Structure**:
```
src/dal/auth/__tests__/
├── timing-attack.test.ts
├── session-lifetime.test.ts
├── rate-limiter.test.ts
└── integration/
    └── full-auth-flow.test.ts
```

### 6.1 Timing Attack Tests

**File**: `src/dal/auth/__tests__/timing-attack.test.ts`

```typescript
import crypto from 'crypto';
import { verifyRefreshToken } from '../refresh/verifyRefreshToken';

describe('Timing Attack Protection', () => {
    it('should use constant-time comparison', async () => {
        const validToken = 'a'.repeat(128); // 64 bytes hex
        const testTokens = [
            'a'.repeat(128),           // Exact match
            'b' + 'a'.repeat(127),     // First char different
            'a'.repeat(127) + 'b',     // Last char different
            'c'.repeat(128),           // All different
        ];
        
        const timings: number[] = [];
        
        for (const token of testTokens) {
            const start = process.hrtime.bigint();
            try {
                // Test comparison function
                const dbBuf = Buffer.from(validToken, 'hex');
                const sendBuf = Buffer.from(token, 'hex');
                crypto.timingSafeEqual(dbBuf, sendBuf);
            } catch (error) {
                // Expected to fail for non-matching
            }
            const end = process.hrtime.bigint();
            timings.push(Number(end - start));
        }
        
        // All timings should be within 20% variance
        const avgTime = timings.reduce((a, b) => a + b) / timings.length;
        timings.forEach(time => {
            const variance = Math.abs(time - avgTime) / avgTime;
            expect(variance).toBeLessThan(0.2);
        });
    });
});
```

### 6.2 Session Lifetime Tests

**File**: `src/dal/auth/__tests__/session-lifetime.test.ts`

```typescript
import { calculateSessionLifetime } from '../helper';
import dayjs from 'dayjs';

describe('Session Lifetime Calculation', () => {
    it('should return 30-day EOL for TOTP login', () => {
        const eol = calculateSessionLifetime({
            isNewDevice: false,
            lastPWValidation: new Date(),
            mfa: { lastValidation: new Date(), type: 'totp' },
            fingerprintRisk: RiskLevel.LOW,
            userRole: AuthRole.user,
        });
        
        const daysFromNow = dayjs(eol).diff(dayjs(), 'days');
        expect(daysFromNow).toBeGreaterThan(28);
        expect(daysFromNow).toBeLessThan(31);
    });
    
    it('should reduce EOL for HIGH risk', () => {
        const lowRiskEOL = calculateSessionLifetime({
            isNewDevice: false,
            lastPWValidation: new Date(),
            fingerprintRisk: RiskLevel.LOW,
            userRole: AuthRole.user,
        });
        
        const highRiskEOL = calculateSessionLifetime({
            isNewDevice: false,
            lastPWValidation: new Date(),
            fingerprintRisk: RiskLevel.HIGH,
            userRole: AuthRole.user,
        });
        
        expect(highRiskEOL).toBeLessThan(lowRiskEOL);
    });
    
    it('should return null if password reauth required', () => {
        const thirtyOneDaysAgo = dayjs().subtract(31, 'days').toDate();
        
        const eol = calculateSessionLifetime({
            isNewDevice: false,
            lastPWValidation: thirtyOneDaysAgo,
            fingerprintRisk: RiskLevel.LOW,
            userRole: AuthRole.user,
        });
        
        expect(eol).toBeNull();
    });
});
```

### 6.3 Rate Limiter Tests

**File**: `src/dal/auth/__tests__/rate-limiter.test.ts`

```typescript
import { createRateLimiter } from '../rateLimiter';

describe('Rate Limiter', () => {
    it('should block after limit exceeded', async () => {
        const limiter = createRateLimiter({ points: 3, duration: 10 });
        const testIP = '1.2.3.4';
        
        // Should succeed 3 times
        await limiter.consume(testIP);
        await limiter.consume(testIP);
        await limiter.consume(testIP);
        
        // 4th attempt should fail
        await expect(limiter.consume(testIP)).rejects.toThrow();
    });
    
    it('should reset after duration', async () => {
        jest.useFakeTimers();
        const limiter = createRateLimiter({ points: 2, duration: 1 });
        const testIP = '5.6.7.8';
        
        // Exhaust limit
        await limiter.consume(testIP);
        await limiter.consume(testIP);
        
        // Should be blocked
        await expect(limiter.consume(testIP)).rejects.toThrow();
        
        // Fast forward 2 seconds
        jest.advanceTimersByTime(2000);
        
        // Should work again
        await expect(limiter.consume(testIP)).resolves.toBeDefined();
        
        jest.useRealTimers();
    });
});
```

### 6.4 Integration Test

**File**: `src/dal/auth/__tests__/integration/full-auth-flow.test.ts`

```typescript
describe('Full Auth Flow', () => {
    it('should complete login → refresh → logout cycle', async () => {
        // 1. Login
        const loginResult = await Login({
            email: 'test@example.com',
            password: 'password123',
            organisationId: testOrg.id,
        });
        
        expect(loginResult.loginSuccessful).toBe(true);
        
        // 2. Get refresh token from cookie
        const refreshToken = getCookie('refreshToken');
        expect(refreshToken).toBeDefined();
        
        // 3. Wait a bit, then refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const refreshResult = await refreshToken();
        expect(refreshResult.status).toBe(200);
        
        // 4. Verify new token different
        const newRefreshToken = getCookie('refreshToken');
        expect(newRefreshToken).not.toBe(refreshToken);
        
        // 5. Logout
        await userLogout();
        
        // 6. Verify tokens revoked
        const tokens = await prisma.refreshToken.findMany({
            where: { userId: testUser.id, status: 'active' }
        });
        expect(tokens).toHaveLength(0);
    });
});
```

### Testing Checklist

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Coverage >80% on auth modules
- [ ] Tests run in CI/CD pipeline

---

## Deployment Checklist

### Pre-deployment
- [ ] All migrations created and tested
- [ ] TypeScript compiles without errors
- [ ] Prisma generates successfully
- [ ] All tests pass
- [ ] Code reviewed
- [ ] Environment variables documented

### Deployment Steps
1. [ ] Run migrations: `npx prisma migrate deploy`
2. [ ] Deploy application code
3. [ ] Verify health endpoint: `/api/health`
4. [ ] Monitor error logs for 1 hour
5. [ ] Check audit logs for anomalies

### Post-deployment
- [ ] Verify session lifetimes working correctly
- [ ] Check rate limiting (test failed logins)
- [ ] Monitor database query performance
- [ ] Verify Redis connection (if enabled)

---

## Dependencies

**Required**:
- `ioredis` - If using Redis features

**Installation**:
```bash
npm install ioredis
```

---

## Environment Variables

```env
# Optional - enables Redis features
REDIS_HOST=redis.internal
REDIS_PORT=6379
REDIS_PASSWORD=secure-password
```

---

## Rollback Plan

If issues arise:

1. **Revert code** to previous version
2. **Database**: Migrations are additive (new fields nullable), safe to keep
3. **Redis**: Simply stop using it (set `REDIS_HOST=` to empty)

---

## Performance Impact

**Expected improvements**:
- Timing attack fix: No measurable impact
- Session EOL storage: -1 query per refresh (faster)
- Redis rate limiter: +0.3ms per check (negligible)
- Database indexes: 2-5x faster auth queries

**No negative performance impacts expected.**

````