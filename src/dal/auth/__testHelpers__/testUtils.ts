/**
 * Test Utility Functions for Authentication DAL Tests
 * 
 * Shared test setup and utility functions to reduce boilerplate.
 */

/**
 * Sets up Jest fake timers for testing time-dependent behavior.
 * Automatically installs before each test and restores after.
 * 
 * Use this in describe blocks where you need to control time.
 * 
 * @example
 * describe('Polling behavior', () => {
 *   setupFakeTimers();
 *   
 *   it('should poll every 100ms', async () => {
 *     const promise = startPolling();
 *     await jest.advanceTimersByTimeAsync(500);
 *     expect(pollCount).toBe(5);
 *   });
 * });
 */
export const setupFakeTimers = (): void => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });
};

/**
 * Advances fake timers and flushes all promises.
 * Useful for testing async operations with timeouts.
 * 
 * @param ms - Milliseconds to advance
 * 
 * @example
 * await advanceTimersAsync(5000); // Advance 5 seconds
 */
export const advanceTimersAsync = async (ms: number): Promise<void> => {
    await jest.advanceTimersByTimeAsync(ms);
};

/**
 * Waits for all pending promises to resolve.
 * Useful in tests with async operations.
 * 
 * @example
 * triggerAsyncOperation();
 * await flushPromises();
 * expect(result).toBeDefined();
 */
export const flushPromises = (): Promise<void> => {
    return new Promise((resolve) => setImmediate(resolve));
};

/**
 * Creates a deferred promise that can be resolved/rejected externally.
 * Useful for controlling async operations in tests.
 * 
 * @returns Object with promise and resolver/rejector functions
 * 
 * @example
 * const { promise, resolve } = createDeferred<string>();
 * const resultPromise = functionUnderTest(promise);
 * resolve('test-value');
 * const result = await resultPromise;
 */
export const createDeferred = <T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
} => {
    let resolve!: (value: T) => void;
    let reject!: (error: Error) => void;
    
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    
    return { promise, resolve, reject };
};
