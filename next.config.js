/** @type {import('next').NextConfig} */
module.exports = {
    distDir: "build",
    eslint: {
        dirs: ["src", "tests"]
    },
    webpack: (config) => {
        // Ignore drizzle-orm since we only use RateLimiterMemory
        config.resolve.alias = {
            ...config.resolve.alias,
            'drizzle-orm': false,
        };
        
        // Also ignore other optional dependencies we don't use
        config.resolve.alias = {
            ...config.resolve.alias,
            'mongodb': false,
            'mysql': false,
            'mysql2': false,
            'pg': false,
            'redis': false,
            'ioredis': false,
        };

        return config;
    },
}