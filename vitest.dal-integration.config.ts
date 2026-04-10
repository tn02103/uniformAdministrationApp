import { defineProject } from 'vitest/config';
import path from 'path';
import { MAX_FORKS } from './vitest/dal-integration-constants';

export default defineProject({
    test: {
        name: 'DAL-Integration',
        environment: 'node',
        globals: true,

        globalSetup: [
            './vitest/setup-dal-integration-global.ts',
        ],

        setupFiles: [
            'dotenv/config',
            './vitest/setup-dal-integration.ts',
        ],

        include: [
            'src/dal/**/*.integration.test.[jt]s?(x)',
        ],

        pool: 'forks',
        maxWorkers: MAX_FORKS,
    },
    resolve: {
        alias: [
            // More specific alias must come first
            { find: /^@\/prisma\/(.*)/, replacement: path.resolve(__dirname, 'prisma/generated/$1') },
            // Stub JSX email modules — must be before the generic @/ alias, otherwise
            // @/lib/email/emailToken gets resolved to src/lib/email/emailToken first
            // and the more specific stubs never match.
            { find: /^@\/lib\/email\/emailToken$/, replacement: path.resolve(__dirname, 'vitest/helpers/emailStubs.ts') },
            { find: /^@\/lib\/email\/tokenReuseDetected$/, replacement: path.resolve(__dirname, 'vitest/helpers/emailStubs.ts') },
            { find: /^@\/lib\/email\/userBlockedEmail$/, replacement: path.resolve(__dirname, 'vitest/helpers/emailStubs.ts') },
            { find: /^@\/lib\/email\/inspectionReview$/, replacement: path.resolve(__dirname, 'vitest/helpers/emailStubs.ts') },
            { find: /^@\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
            // Replace ioredis with in-memory mock in tests
            { find: 'ioredis', replacement: path.resolve(__dirname, 'node_modules/ioredis-mock') },
        ],
    },
});
