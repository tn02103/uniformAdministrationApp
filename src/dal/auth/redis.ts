import Redis from 'ioredis';

let redis: Redis | null = null;
let redisEnabled = false;
let connectionAttempted = false;

// Check if Redis is enabled via environment variable
if (process.env.REDIS_ENABLED === 'true') {
    redisEnabled = true;
    
    if (process.env.REDIS_HOST) {
        redis = new Redis({
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            lazyConnect: true,
            retryStrategy: (times) => {
                // Stop retrying after 3 attempts
                if (times > 3) {
                    console.error('Redis: Max connection attempts reached. Continuing without Redis.');
                    return null;
                }
                // Exponential backoff: 50ms, 100ms, 200ms
                return Math.min(times * 50, 200);
            },
            maxRetriesPerRequest: 3,
        });
        
        redis.on('error', (error) => {
            console.error('Redis connection error:', error.message);
            // Don't throw - allow app to continue without Redis
        });
        
        redis.on('connect', () => {
            console.info('Redis connected successfully');
            connectionAttempted = true;
        });
        
        redis.on('close', () => {
            console.warn('Redis connection closed');
        });
        
        // Attempt initial connection
        redis.connect().catch((error) => {
            console.error('Redis: Failed to establish initial connection:', error.message);
            console.error('Redis: Application will continue without Redis features');
            connectionAttempted = true;
        });
    } else {
        console.error('Redis: REDIS_ENABLED is true but REDIS_HOST is not set');
    }
}

/**
 * Check if Redis is available and connected
 */
export const isRedisAvailable = (): boolean => {
    if (!redisEnabled) return false;
    if (!redis) return false;
    return redis.status === 'ready';
};

/**
 * Check if Redis was enabled but failed to connect
 */
export const isRedisConfiguredButUnavailable = (): boolean => {
    return redisEnabled && connectionAttempted && !isRedisAvailable();
};

export { redis };
