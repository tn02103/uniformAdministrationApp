import { RefreshLockManager } from './RefreshLockManager';

describe('RefreshLockManager - Frontend Lock Mechanism', () => {
    let lockManager: RefreshLockManager;
    let localStorageMock: { [key: string]: string };

    beforeEach(() => {
        // Reset singleton instance
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (RefreshLockManager as any).instance = undefined;
        lockManager = RefreshLockManager.getInstance();

        // Mock localStorage
        localStorageMock = {};
        global.localStorage = {
            getItem: jest.fn((key: string) => localStorageMock[key] || null),
            setItem: jest.fn((key: string, value: string) => {
                localStorageMock[key] = value;
            }),
            removeItem: jest.fn((key: string) => {
                delete localStorageMock[key];
            }),
            clear: jest.fn(() => {
                localStorageMock = {};
            }),
            length: 0,
            key: jest.fn(),
        } as unknown as Storage;

        // Mock crypto.randomUUID
        let uuidCounter = 0;
        global.crypto = {
            ...global.crypto,
            randomUUID: jest.fn(() => `process-${++uuidCounter}`),
        } as unknown as Crypto;

        jest.clearAllMocks();
    });

    describe('Singleton pattern', () => {
        it('should return same instance', () => {
            const instance1 = RefreshLockManager.getInstance();
            const instance2 = RefreshLockManager.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('Lock acquisition', () => {
        it('should acquire lock when no existing lock', async () => {
            const processId = await lockManager.acquireLock();
            
            expect(processId).toBe('process-1');
            expect(localStorage.setItem).toHaveBeenCalled();
        });

        it('should fail to acquire lock when another process holds it', async () => {
            // First process acquires lock
            const processId1 = await lockManager.acquireLock();
            expect(processId1).not.toBeNull();

            // Second process tries to acquire
            const lockManager2 = RefreshLockManager.getInstance();
            const processId2 = await lockManager2.acquireLock();
            
            expect(processId2).toBeNull();
        });

        it('should acquire stale lock after timeout', async () => {
            // Set stale lock (11 seconds old)
            const staleLock = {
                timestamp: Date.now() - 11000,
                processId: 'stale-process',
            };
            localStorageMock['uniform-refresh-lock'] = JSON.stringify(staleLock);

            const processId = await lockManager.acquireLock();
            
            expect(processId).not.toBeNull();
        });

        it('should handle race condition with 100ms double-check', async () => {
            jest.useFakeTimers();

            const acquirePromise = lockManager.acquireLock();
            
            // Fast-forward 100ms
            jest.advanceTimersByTime(100);
            await Promise.resolve(); // Let promises resolve

            const processId = await acquirePromise;
            expect(processId).not.toBeNull();

            jest.useRealTimers();
        });

        it('should return null if lock stolen during double-check', async () => {
            jest.useFakeTimers();

            const acquirePromise = lockManager.acquireLock();
            
            // Simulate another process stealing the lock during 100ms wait
            setTimeout(() => {
                localStorageMock['uniform-refresh-lock'] = JSON.stringify({
                    timestamp: Date.now(),
                    processId: 'other-process',
                });
            }, 50);

            jest.advanceTimersByTime(100);
            await Promise.resolve();

            const processId = await acquirePromise;
            expect(processId).toBeNull();

            jest.useRealTimers();
        });
    });

    describe('Lock release', () => {
        it('should release lock when owner calls release', async () => {
            const processId = await lockManager.acquireLock();
            expect(processId).not.toBeNull();

            const released = lockManager.releaseLock(processId!);
            
            expect(released).toBe(true);
            expect(localStorage.removeItem).toHaveBeenCalledWith('uniform-refresh-lock');
        });

        it('should fail to release lock with wrong processId', async () => {
            const processId = await lockManager.acquireLock();
            expect(processId).not.toBeNull();

            const released = lockManager.releaseLock('wrong-process-id');
            
            expect(released).toBe(false);
            expect(localStorage.removeItem).not.toHaveBeenCalled();
        });

        it('should fail to release if lock already released', async () => {
            const processId = await lockManager.acquireLock();
            expect(processId).not.toBeNull();

            lockManager.releaseLock(processId!);
            const secondRelease = lockManager.releaseLock(processId!);
            
            expect(secondRelease).toBe(false);
        });

        it('should fail to release if lock stolen by another process', async () => {
            const processId = await lockManager.acquireLock();
            expect(processId).not.toBeNull();

            // Another process steals the lock
            localStorageMock['uniform-refresh-lock'] = JSON.stringify({
                timestamp: Date.now(),
                processId: 'thief-process',
            });

            const released = lockManager.releaseLock(processId!);
            
            expect(released).toBe(false);
            expect(localStorage.removeItem).not.toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        it('should handle localStorage errors gracefully', async () => {
            (localStorage.getItem as jest.Mock).mockImplementation(() => {
                throw new Error('Storage error');
            });

            const processId = await lockManager.acquireLock();
            
            expect(processId).toBeNull();
        });

        it('should log error when lock acquisition fails', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            (localStorage.setItem as jest.Mock).mockImplementation(() => {
                throw new Error('Storage error');
            });

            await lockManager.acquireLock();
            
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Lock acquisition failed:',
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it('should log error when lock release fails', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const processId = await lockManager.acquireLock();

            (localStorage.removeItem as jest.Mock).mockImplementation(() => {
                throw new Error('Storage error');
            });

            lockManager.releaseLock(processId!);
            
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Lock release failed:',
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Concurrent access scenarios', () => {
        it('should allow only one of multiple concurrent acquisitions', async () => {
            const manager1 = RefreshLockManager.getInstance();
            const manager2 = RefreshLockManager.getInstance();
            const manager3 = RefreshLockManager.getInstance();

            const [processId1, processId2, processId3] = await Promise.all([
                manager1.acquireLock(),
                manager2.acquireLock(),
                manager3.acquireLock(),
            ]);

            const successfulAcquisitions = [processId1, processId2, processId3].filter(id => id !== null);
            
            // Only one should succeed
            expect(successfulAcquisitions).toHaveLength(1);
        });

        it('should allow second acquisition after first releases', async () => {
            const processId1 = await lockManager.acquireLock();
            expect(processId1).not.toBeNull();

            lockManager.releaseLock(processId1!);

            const processId2 = await lockManager.acquireLock();
            expect(processId2).not.toBeNull();
            expect(processId2).not.toBe(processId1);
        });
    });

    describe('Process ID uniqueness', () => {
        it('should generate unique processId for each acquisition', async () => {
            const processId1 = await lockManager.acquireLock();
            lockManager.releaseLock(processId1!);

            const processId2 = await lockManager.acquireLock();
            lockManager.releaseLock(processId2!);

            const processId3 = await lockManager.acquireLock();

            expect(processId1).not.toBe(processId2);
            expect(processId2).not.toBe(processId3);
            expect(processId1).not.toBe(processId3);
        });
    });
});
