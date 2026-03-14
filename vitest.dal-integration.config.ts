import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        name: 'DAL-Integration',
        environment: 'node',
        globals: true,

        setupFiles: [
            'dotenv/config',
            './vitest/setup-dal-integration.ts',
        ],

        include: [
            'src/dal/**/*.integration.test.[jt]s?(x)',
        ],

        // Sequential execution is required for database integrity
        fileParallelism: false,
    },
    resolve: {
        alias: [
            // More specific alias must come first
            { find: /^@\/prisma\/(.*)/, replacement: path.resolve(__dirname, 'prisma/generated/$1') },
            { find: /^@\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
            // Replace ioredis with in-memory mock in tests
            { find: 'ioredis', replacement: path.resolve(__dirname, 'node_modules/ioredis-mock') },
        ],
    },
});
