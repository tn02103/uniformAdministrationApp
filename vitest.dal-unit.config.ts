import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        name: 'DAL-Unit',
        environment: 'node',
        globals: true,

        setupFiles: [
            './vitest/setup-dal-unit.ts',
        ],

        include: [
            'src/dal/**/*.test.[jt]s?(x)',
        ],
        exclude: [
            '**/*.integration.test.*',
            'node_modules/**',
        ],

        // Fast execution for unit tests
        fileParallelism: true,
    },
    resolve: {
        alias: [
            { find: /^@\/prisma\/(.*)/, replacement: path.resolve(__dirname, 'prisma/generated/$1') },
            { find: /^@\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
            { find: '@test-utils/prisma-mock', replacement: path.resolve(__dirname, 'vitest/setup-dal-unit') },
        ],
    },
});
