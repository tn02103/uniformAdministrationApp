/**
 * RefreshLockManager handles cross-tab synchronization for token refresh operations.
 * Ensures only one tab/process refreshes tokens at a time using localStorage-based locking.
 */
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
    
    /**
     * Attempt to acquire the refresh lock.
     * @returns processId if lock acquired, null if another process holds the lock
     */
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
    
    /**
     * Release the lock if we own it.
     * @param processId The processId returned from acquireLock
     * @returns true if lock was successfully released, false otherwise
     */
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
