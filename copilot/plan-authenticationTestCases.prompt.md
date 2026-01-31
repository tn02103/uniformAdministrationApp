# Authentication System - Test Cases

## Overview
This document contains test cases identified during security analysis and feature development. These tests should be implemented to ensure the authentication system works correctly and securely.

---

## Race Condition & Concurrency Tests

### Test 1: Concurrent Refresh Token Requests
**Priority**: CRITICAL
**Related Issue**: Race Condition in Token Refresh (#1)

**Description**: Verify that when two simultaneous refresh requests are made with the same refresh token, only one succeeds and the other is properly rejected.

**Test Code**:
```typescript
describe('Refresh Token - Concurrent Requests', () => {
    it('should handle race condition: one request succeeds, one fails', async () => {
        // Setup: User logged in with valid refresh token
        const { refreshToken, userId } = await createAuthenticatedUser();
        
        // Execute: Send 2 simultaneous refresh requests
        const [result1, result2] = await Promise.allSettled([
            fetch('/api/auth/refresh', { 
                method: 'POST',
                headers: { Cookie: `refreshToken=${refreshToken}` }
            }),
            fetch('/api/auth/refresh', { 
                method: 'POST',
                headers: { Cookie: `refreshToken=${refreshToken}` }
            })
        ]);
        
        // Assert: One succeeds (200), one fails with reuse detection
        const responses = [result1, result2].map(r => 
            r.status === 'fulfilled' ? r.value.status : null
        );
        
        expect(responses).toContain(200); // One success
        expect(responses).toContain(401); // One failure (or null if promise rejected)
        
        // Verify: Only one new token was created
        const tokens = await prisma.refreshToken.findMany({
            where: { 
                userId,
                rotatedFromTokenId: oldTokenId 
            }
        });
        expect(tokens).toHaveLength(1);
    });
    
    it('should handle race condition with 3+ concurrent requests', async () => {
        const { refreshToken, userId } = await createAuthenticatedUser();
        
        // Send 5 simultaneous requests
        const results = await Promise.allSettled(
            Array(5).fill(null).map(() => 
                fetch('/api/auth/refresh', { 
                    method: 'POST',
                    headers: { Cookie: `refreshToken=${refreshToken}` }
                })
            )
        );
        
        const successCount = results.filter(r => 
            r.status === 'fulfilled' && r.value.status === 200
        ).length;
        
        // Only 1 should succeed
        expect(successCount).toBe(1);
    });
});