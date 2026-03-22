import { defineProject } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineProject({
    plugins: [react()],
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
            // Stub problematic server-side and JSX modules so the node test
            // environment never loads server-only / next-international or React
            // email templates. More specific aliases must come before the generic
            // @/ alias so they take precedence.
            { find: 'server-only', replacement: path.resolve(__dirname, 'vitest/helpers/serverOnlyStub.ts') },
            { find: /^@\/lib\/locales\/config$/, replacement: path.resolve(__dirname, 'vitest/helpers/localeStubs.ts') },
            { find: /^@\/lib\/email\/emailToken$/, replacement: path.resolve(__dirname, 'vitest/helpers/emailStubs.ts') },
            { find: /^@\/lib\/email\/passwordResetEmail$/, replacement: path.resolve(__dirname, 'vitest/helpers/emailStubs.ts') },
            { find: /^@\/lib\/email\/passwordChangedEmail$/, replacement: path.resolve(__dirname, 'vitest/helpers/emailStubs.ts') },
            { find: /^@\/lib\/email\/tokenReuseDetected$/, replacement: path.resolve(__dirname, 'vitest/helpers/emailStubs.ts') },
            { find: /^@\/lib\/email\/userBlockedEmail$/, replacement: path.resolve(__dirname, 'vitest/helpers/emailStubs.ts') },
            { find: /^@\/lib\/email\/inspectionReview$/, replacement: path.resolve(__dirname, 'vitest/helpers/emailStubs.ts') },
            { find: /^@\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
            { find: '@test-utils/prisma-mock', replacement: path.resolve(__dirname, 'vitest/setup-dal-unit') },
        ],
    },
});
