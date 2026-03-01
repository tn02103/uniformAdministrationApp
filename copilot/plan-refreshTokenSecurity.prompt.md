````prompt
# Refresh Token Security Implementation Plan

## Context

**Problem**: Multiple critical security issues in token refresh workflow that allow race conditions, improper reuse detection, and token rotation failures.

**Current Architecture**:
- Refresh tokens stored in PostgreSQL with token families
- Frontend: React AuthProvider with BroadcastChannel for tab sync
- Backend: Next.js API route + Prisma ORM
- Multi-pod deployment planned (currently single server)

**Key Files**:
- `src/dal/auth/refresh/refreshAccessToken.ts` - Main refresh logic
- `src/dal/auth/refresh/verifyRefreshToken.ts` - Token validation
- `src/dal/auth/refresh/handleReuse.ts` - Reuse detection
- `src/dal/auth/helper.tokens.ts` - Token rotation (lines 70-130)
- `src/lib/auth/AuthProvider.tsx` - Frontend refresh logic
- `prisma/schema.prisma` - RefreshToken model

---

## Task 1a: Fix Token Family Revocation Strategy

**Current Issue**: When reuse detected, code revokes by `userId` (all devices) or `deviceId` (one device), but doesn't use `tokenFamilyId`.

**Goal**: Revoke by token family for targeted response. Include IP change detection.

### Implementation

**File**: `src/dal/auth/refresh/handleReuse.ts`

**Changes Required**:

1. **Add IP change detection** (line ~15-40):
```typescript
const ipChanged = token.usedIpAddress !== ipAddress;
```

2. **Revise revocation strategy** (lines 38-104):

**New Logic**:
```typescript
// SCENARIO 1: Network retry without Redis (defense in depth)
// Only fires if both frontend lock AND Redis idempotency failed
if (!isRedisAvailable() && 
    fingerprint.riskLevel === RiskLevel.LOW && 
    !ipChanged && 
    timeSinceUse < 1000) {
    // Inform developers but don't spook users
    await sendTokenReuseDetectedEmail(token.userId, false); // sendUserEmail=false
    
    throw new AuthenticationException(
        "Token already used (possible network retry - Redis unavailable)",
        "AuthenticationFailed",
        LogDebugLevel.WARNING,
        logData
    );
}

// SCENARIO 2: Different IP (token in two locations = definite attack)
if (ipChanged) {
    // Revoke device + all sessions
    await prisma.refreshToken.updateMany({
        where: { deviceId: token.deviceId, status: "active" },
        data: { status: "revoked" }
    });
    await prisma.session.updateMany({
        where: { deviceId: token.deviceId, valid: true },
        data: { valid: false }
    });
    
    // Alert BOTH developers and user (high certainty)
    await sendTokenReuseDetectedEmail(token.userId, true); // sendUserEmail=true
    
    throw new AuthenticationException(...);
}

// SCENARIO 3: Different device (fingerprint mismatch = likely attack)
if (fingerprint.riskLevel >= RiskLevel.MEDIUM) {
    // Revoke device + all sessions
    await prisma.refreshToken.updateMany({
        where: { deviceId: token.deviceId, status: "active" },
        data: { status: "revoked" }
    });
    await prisma.session.updateMany({
        where: { deviceId: token.deviceId, valid: true },
        data: { valid: false }
    });
    
    // Alert BOTH developers and user (high certainty)
    await sendTokenReuseDetectedEmail(token.userId, true); // sendUserEmail=true
    
    throw new AuthenticationException(...);
}

// SCENARIO 4: Same device + Same IP + Slow (>1s = suspicious but not certain)
// Revoke token family only (this device session chain)
await prisma.refreshToken.updateMany({
    where: { tokenFamilyId: token.tokenFamilyId, status: "active" },
    data: { status: "revoked" }
});
await prisma.session.updateMany({
    where: { 
        refreshTokens: { some: { tokenFamilyId: token.tokenFamilyId } }
    },
    data: { valid: false }
});

// Alert developers only (not certain enough to alarm user)
await sendTokenReuseDetectedEmail(token.userId, false); // sendUserEmail=false

throw new AuthenticationException(...);
```

**Notification Strategy**:
- **Developers**: Alerted for ALL reuse scenarios (helps monitor for patterns)
- **Users**: Only alerted for high-certainty attacks (Scenarios 2 & 3)
- **Rationale**: Avoid alert fatigue while maintaining security oversight

**Update Required to Existing Function**:

**File**: `src/lib/email/tokenReuseDetected.tsx`

Add `sendUserEmail` parameter:
```typescript
export const sendTokenReuseDetectedEmail = async (userId: string, sendUserEmail: boolean = true) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organisation: true }
    });
    if (!user) {
        console.error(`sendTokenReuseDetectedEmail: User with id ${userId} not found`);
        return;
    }

    // Send user email only if requested (high-certainty scenarios)
    if (sendUserEmail) {
        try {
            await getMailAgend().sendMail({
                to: user.email,
                subject: "Ihr UniformAdmin Benutzerkonto wurde gesperrt",
                html: await render(UserTokenReuseEmailBody({ name: user.name })),
            });
        } catch (error) {
            console.error(`sendTokenReuseDetectedEmail: Failed to send email to user ${user.email}`, error);
        }
    }
    
    // Always send developer notification
    if (process.env.DEVELOPER_NOTIFICATION_EMAILS) {
        try {
            await getMailAgend().sendMail({
                to: process.env.DEVELOPER_NOTIFICATION_EMAILS?.split(","),
                subject: "Ein Benutzerkonto Ihrer Organisation wurde gesperrt",
                html: await render(DeveloperTokenReuseEmailBody(user.email, sendUserEmail)),
            });
        } catch (error) {
            console.error(`sendTokenReuseDetectedEmail: Failed to send email to developers`, error);
        }
    }
}

// Update developer email to indicate if user was notified
const DeveloperTokenReuseEmailBody = (userEmail: string, userNotified: boolean) => {
    return (
        <Html>
            <h1>Benachrichtigung: Verdächtige Token-Wiederverwendung erkannt</h1>
            <span>Das Benutzerkonto mit der E-Mail {userEmail} hat eine verdächtige Wiederverwendung eines Refresh-Tokens festgestellt.</span><br />
            <span>Alle aktiven Sitzungen und Refresh-Tokens für dieses Konto wurden widerrufen.</span><br />
            <span><strong>Benutzer benachrichtigt:</strong> {userNotified ? "Ja" : "Nein (niedrige Sicherheit)"}</span><br />
            <span>Bitte überprüfen Sie die Sicherheitsprotokolle und kontaktieren Sie den Benutzer bei Bedarf.</span><br />
        </Html>
    )
}
```

**Key Points**:
- Always invalidate sessions with tokens
- IP change = immediate severe response
- Token family revocation for same-device issues

### Testing

- [ ] Same device, same IP, <1s (no Redis) → rejected, no revocation, developer alert only
- [ ] Same device, same IP, <1s (with Redis) → should not reach handleReuse (cached)
- [ ] Same device, different IP → device revoked, developer alert + user email
- [ ] Different fingerprint → device revoked, developer alert + user email
- [ ] Same device, same IP, >1s → family revoked, developer alert only (no user email)
- [ ] Verify sessions invalidated in all cases

---

## Task 1b: Fix Token Rotation Race Condition

**Current Issue**: Two concurrent requests can both pass `usedAt: null` check and rotate the same token.

**Goal**: Make token rotation atomic using Prisma transaction.

### Implementation

**File**: `src/dal/auth/helper.tokens.ts` (lines 70-130)

**Changes Required**:

1. **Always wrap in transaction to minimize code duplication**:
```typescript
export const issueNewRefreshToken = async (props: IssueNewRefreshTokenProps) => {
    const {
        cookieList,
        deviceId,
        userId,
        ipAddress,
        usedRefreshTokenId,
        endOfLife = dayjs().add(3, "days").toDate(),
        userAgent,
        mode,
    } = props;

    try {
        await prisma.$transaction(async (tx) => {
            let tokenFamilyId: string;
            let newToken: string;
            let newTokenHash: string;

            if (mode === "refresh") {
                // Step 1: Mark old token as used (ATOMIC)
                const oldToken = await tx.refreshToken.update({
                    where: {
                        id: usedRefreshTokenId,
                        userId: userId,
                        status: "active",
                        usedAt: null, // Database checks this atomically
                    },
                    data: {
                        usedAt: new Date(),
                        usedIpAddress: ipAddress,
                        usedUserAgent: JSON.stringify(userAgent),
                        status: "rotated",
                    }
                });

                // Step 2: Revoke any other active tokens for this device
                await tx.refreshToken.updateMany({
                    where: {
                        deviceId: deviceId,
                        userId: userId,
                        status: "active",
                        endOfLife: { gt: new Date() },
                        id: { not: usedRefreshTokenId },
                    },
                    data: {
                        status: "revoked",
                    }
                });

                tokenFamilyId = oldToken.tokenFamilyId;
            } else {
                // "new" mode - generate new family
                tokenFamilyId = crypto.randomUUID();
            }

            // Step 3: Create new token (same for both modes)
            newToken = crypto.randomBytes(64).toString('base64url');
            newTokenHash = sha256Hex(newToken);

            await tx.refreshToken.create({
                data: {
                    userId: userId,
                    deviceId: deviceId,
                    sessionId: props.sessionId,
                    token: newTokenHash,
                    endOfLife,
                    issuerIpAddress: ipAddress,
                    tokenFamilyId: tokenFamilyId,
                    rotatedFromTokenId: mode === "refresh" ? usedRefreshTokenId : null,
                    status: "active",
                }
            });

            // Step 4: Set cookie (done after transaction commits)
            cookieList.set(AuthConfig.refreshTokenCookie, newToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                expires: endOfLife,
                path: '/api/auth/refresh',
            });
        }, {
            isolationLevel: 'Serializable',
            timeout: 5000,
        });
    } catch (error) {
        // Handle race condition
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                // Record not found = token already used
                throw new AuthenticationException(
                    "Refresh token was already used (race condition or replay attack)",
                    "RefreshTokenReuseDetected",
                    LogDebugLevel.CRITICAL,
                    props.logData
                );
            }
        }
        throw error;
    }
};
```

**Key Points**:
- Transaction used for BOTH "new" and "refresh" modes (eliminates code duplication)
- `Serializable` isolation prevents phantom reads
- Failed update throws `P2025` error (only relevant for "refresh" mode)
- Second request gets error before creating duplicate token
- Cookie setting happens after transaction commits
- Minor performance cost (~2-5ms) for "new" mode is acceptable for code simplicity

### Testing

- [ ] Send 2 concurrent refresh requests
- [ ] Verify only 1 succeeds with 200
- [ ] Verify second gets 401/409 error
- [ ] Check DB: only 1 new token created
- [ ] Old token has `status: "rotated"` and `usedAt` set

---

## Task 1c: Fix Frontend Race Condition

**Current Issue**: Multiple tabs can call `refreshToken()` simultaneously before BroadcastChannel sync.

**Goal**: Implement lock mechanism so only one tab refreshes at a time.

### Implementation

**New File**: `src/lib/auth/RefreshLockManager.ts`

```typescript
export class RefreshLockManager {
    private static instance: RefreshLockManager;
    private lockKey = 'uniform-refresh-lock';
    private lockTimeout = 10000; // 10 seconds
    private currentProcessId: string | null = null;
    
    static getInstance() {
        if (!RefreshLockManager.instance) {
            RefreshLockManager.instance = new RefreshLockManager();
        }
        return RefreshLockManager.instance;
    }
    
    async acquireLock(): Promise<string | null> {
        const now = Date.now();
        
        try {
            // Generate unique processId for this specific refresh operation
            const processId = crypto.randomUUID();
            const lock = {
                timestamp: now,
                processId: processId
            };
            
            const existingLock = localStorage.getItem(this.lockKey);
            
            if (existingLock) {
                const parsed = JSON.parse(existingLock);
                // Check if lock is stale
                if (now - parsed.timestamp < this.lockTimeout) {
                    return null; // Lock held by another process
                }
            }
            
            // Set our lock
            localStorage.setItem(this.lockKey, JSON.stringify(lock));
            
            // Wait a bit and verify we still have it (handle race)
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const currentLock = localStorage.getItem(this.lockKey);
            if (!currentLock) return null;
            
            const current = JSON.parse(currentLock);
            if (current.processId === processId) {
                this.currentProcessId = processId;
                return processId; // Return the processId for verification on unlock
            }
            
            return null;
            
        } catch (error) {
            console.error('Lock acquisition failed:', error);
            return null;
        }
    }
    
    releaseLock(processId: string): boolean {
        try {
            // Verify we still own the lock before releasing
            const currentLock = localStorage.getItem(this.lockKey);
            
            if (!currentLock) {
                console.warn('Lock already released');
                return false;
            }
            
            const parsed = JSON.parse(currentLock);
            
            if (parsed.processId !== processId) {
                console.error('Lock owned by different process, not releasing');
                return false;
            }
            
            if (this.currentProcessId !== processId) {
                console.error('ProcessId mismatch with stored value, not releasing');
                return false;
            }
            
            localStorage.removeItem(this.lockKey);
            this.currentProcessId = null;
            return true;
            
        } catch (error) {
            console.error('Lock release failed:', error);
            return false;
        }
    }
}
```

**File**: `src/lib/auth/AuthProvider.tsx` - Modify `refreshToken` function

```typescript
import { RefreshLockManager } from './RefreshLockManager';

const refreshToken = useCallback(async () => {
    console.debug("AuthProvider ~ refreshToken called");
    if (authState.isRefreshing) return;

    const lockManager = RefreshLockManager.getInstance();
    const processId = await lockManager.acquireLock();
    
    if (!processId) {
        console.debug("Another refresh process is active, waiting for broadcast");
        // Wait for the other process to finish and broadcast result
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.warn("Refresh broadcast timeout, retrying");
                resolve(refreshToken()); // Retry
            }, 5000);
            
            const handler = (event: MessageEvent) => {
                if (event.data.type === 'TOKEN_REFRESHED') {
                    clearTimeout(timeout);
                    broadcastChannelRef.current?.removeEventListener('message', handler);
                    resolve();
                }
            };
            
            broadcastChannelRef.current?.addEventListener('message', handler);
        });
    }

    setAuthState(prev => ({ ...prev, isRefreshing: true }));
    const now = dayjs().toISOString();

    try {
        const response = await fetch('/api/auth/refresh', { method: 'POST' });
        console.debug("AuthProvider ~ refreshToken response:", response);

        if (response.ok) {
            const newTokenState = {
                lastSuccess: now,
                lastTry: now,
                state: "success" as const
            };

            setAuthState(prev => ({
                ...prev,
                lastAccessTokenRefresh: newTokenState,
                isRefreshing: false
            }));

            broadcastChannelRef.current?.postMessage({
                type: 'TOKEN_REFRESHED',
                data: newTokenState
            });

            localStorage.setItem(storageKey, JSON.stringify({
                lastAccessTokenRefresh: newTokenState
            }));
        } else {
            // ... existing error handling
        }
    } catch (error) {
        // ... existing error handling
    } finally {
        const released = lockManager.releaseLock(processId);
        if (!released) {
            console.warn('Failed to release lock properly - may have been stolen by another process');
        }
    }
}, [authState.isRefreshing, authState.lastAccessTokenRefresh.lastSuccess, router, params.locale]);
```

**Key Points**:
- Lock uses localStorage (shared across tabs)
- `crypto.randomUUID()` generates unique processId per refresh operation (more granular than tabId)
- Each refresh invocation gets its own processId (even if same tab)
- 100ms double-check prevents race in lock acquisition
- `releaseLock(processId)` verifies lock ownership before releasing (prevents process A releasing process B's lock)
- Timeout ensures lock doesn't deadlock (10s expiration)
- Non-acquiring processes wait for BroadcastChannel message
- Failed unlock logged as warning (potential security issue)
- ProcessId approach better than tabId: handles concurrent refresh attempts from same tab (e.g., user clicks refresh button rapidly)

### Testing

- [ ] Open 3 tabs simultaneously
- [ ] Trigger refresh (wait for interval)
- [ ] Check network tab: only 1 refresh request
- [ ] Verify all tabs receive BroadcastChannel update
- [ ] Check localStorage during refresh

---

## Task 1d: Network Retry Detection with Redis

**Current Issue**: Can't distinguish between malicious reuse and legitimate network retries.

**Goal**: Use idempotency keys + Redis to detect network retries.

### Prerequisites

**Install**: `npm install ioredis`

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

**Environment**:
```env
# .env.local (development - optional)
# REDIS_HOST not set

# .env.production
REDIS_HOST=redis.production.internal
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

### Implementation

**File**: `src/lib/auth/AuthProvider.tsx`

Add idempotency key to requests:

```typescript
const refreshToken = useCallback(async () => {
    // ... lock acquisition code
    
    // Generate idempotency key
    const idempotencyKey = crypto.randomUUID();
    
    try {
        const response = await fetch('/api/auth/refresh', { 
            method: 'POST',
            headers: {
                'X-Idempotency-Key': idempotencyKey
            }
        });
        // ... rest of code
    } finally {
        lockManager.releaseLock();
    }
}, [/* deps */]);
```

**File**: `src/dal/auth/refresh/refreshAccessToken.ts`

Add caching logic:

```typescript
import { redis, isRedisAvailable } from '../redis';

export const refreshToken = async (): Promise<RefreshResponse> => {
    try {
        const headerList = await headers();
        const cookieList = await cookies();
        
        const idempotencyKey = headerList.get('x-idempotency-key');
        
        // Check cache if Redis available
        if (idempotencyKey && isRedisAvailable()) {
            try {
                const cached = await redis!.get(`idempotency:${idempotencyKey}`);
                if (cached) {
                    console.log('Returning cached refresh response');
                    return JSON.parse(cached);
                }
            } catch (error) {
                console.warn('Redis error, proceeding without cache:', error);
            }
        }
        
        // ... existing refresh logic
        
        const response = {
            status: 200,
            message: "Tokens refreshed successfully"
        };
        
        // Cache successful result
        if (idempotencyKey && response.status === 200 && isRedisAvailable()) {
            try {
                await redis!.setex(
                    `idempotency:${idempotencyKey}`,
                    10, // 10 second TTL
                    JSON.stringify(response)
                );
            } catch (error) {
                console.warn('Failed to cache response:', error);
            }
        }
        
        return response;
    } catch (error) {
        // ... existing error handling
    }
};
```

**File**: `src/dal/auth/refresh/handleReuse.ts`

Update to check idempotency:

```typescript
export const handleRefreshTokenReuse = async (props: HandleRefreshTokenReuseProps) => {
    const { token, ipAddress, agent, logData, idempotencyKey } = props;
    
    // Check if this is a cached idempotent retry
    if (idempotencyKey && isRedisAvailable()) {
        try {
            const originalRequest = await redis!.get(`idempotency:${idempotencyKey}`);
            if (originalRequest) {
                // This request was already processed successfully
                throw new AuthenticationException(
                    "Idempotent network retry detected",
                    "NetworkRetry",
                    LogDebugLevel.INFO,
                    logData
                );
            }
        } catch (error) {
            console.warn('Redis error checking idempotency:', error);
        }
    }
    
    // ... existing reuse detection logic
};
```

**Key Points**:
- Redis is optional (graceful fallback)
- 10-second TTL for idempotency keys
- Network retries return cached response
- No token rotation on cached hits

### Testing

- [ ] Without Redis: app works normally
- [ ] Start Redis: `docker run -d -p 6379:6379 redis:7-alpine`
- [ ] Set `REDIS_HOST=localhost`
- [ ] Send request, check Redis: `redis-cli GET idempotency:xxx`
- [ ] Send duplicate request → verify cached response
- [ ] Wait 11 seconds → verify key expired
- [ ] Stop Redis → verify graceful fallback

---

## Fix Token Reuse Time Window Bug (CRITICAL)

**Current Issue**: Checking minutes instead of milliseconds on line 109 of `handleReuse.ts`.

**File**: `src/dal/auth/refresh/handleReuse.ts` (lines 109-118)

**Change**:
```typescript
// Current (WRONG):
const minutesSinceInitialUse = Math.abs(dayjs().diff(dayjs(props.initialTokenUse), 'minutes'));

if (minutesSinceInitialUse > 15) return "SEVERE";
if (minutesSinceInitialUse > 5) return "MEDIUM";
return "LOW";

// Fixed (CORRECT):
const millisecondsSinceInitialUse = Math.abs(dayjs().diff(dayjs(props.initialTokenUse), 'milliseconds'));

if (millisecondsSinceInitialUse > 5000) return "SEVERE";  // 5 seconds
if (millisecondsSinceInitialUse > 1000) return "MEDIUM";  // 1 second
return "LOW";
```

This is a **critical vulnerability** - attacks within 5 minutes currently treated as low risk!

---

## Testing Checklist

### Unit Tests
- [ ] Concurrent token rotation (2 requests, 1 succeeds)
- [ ] Token reuse with same IP (family revoked)
- [ ] Token reuse with different IP (device revoked)
- [ ] Idempotency cache hit (cached response)
- [ ] Frontend lock (only 1 tab refreshes)

### Integration Tests
- [ ] Full flow: Login → Wait → Refresh (3 tabs) → Verify
- [ ] Reuse attack simulation
- [ ] Redis failure graceful degradation
- [ ] Network retry scenario

### Manual Tests
- [ ] Open 3 tabs, trigger refresh, check network tab
- [ ] Check Redis keys: `redis-cli KEYS "*"`
- [ ] Check audit logs for proper events
- [ ] Stop Redis, verify app works
- [ ] Restart Redis, verify it's used again

---

## Deployment Notes

**Database**: No migrations needed for this phase

**Dependencies**: 
- `npm install ioredis` (if using Redis)

**Environment Variables**:
```env
REDIS_HOST=redis.internal  # Optional, enables Redis features
REDIS_PORT=6379
REDIS_PASSWORD=secure-password
```

**Redis Setup** (Docker):
```bash
docker run -d -p 6379:6379 -v redis-data:/data redis:7-alpine redis-server --appendonly yes
```

**Verification**:
- [ ] All TypeScript compiles
- [ ] Prisma generates without errors
- [ ] Tests pass
- [ ] No console errors in browser

````
