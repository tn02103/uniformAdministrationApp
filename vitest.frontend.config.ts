import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Transforms jest.mock( → vi.mock( in test and helper files so that
 * Vitest's static hoisting mechanism picks them up and registers the
 * mocks before any imports are resolved.
 */
const jestMockToViMock: Plugin = {
    name: 'jest-mock-to-vi-mock',
    // Run before Vitest's own transform so the patterns are detected for hoisting
    enforce: 'pre',
    transform(code, id) {
        // Skip node_modules and the setup file itself
        if (id.includes('node_modules') || id.includes('setup-components')) {
            return;
        }
        if (code.includes('jest.mock(')) {
            return {
                code: code.replace(/\bjest\.mock\(/g, 'vi.mock('),
                map: null,
            };
        }
    },
};

export default defineConfig({
    plugins: [jestMockToViMock, react()],
    test: {
        name: 'Frontend',
        environment: 'jsdom',
        globals: true,
        css: {
            modules: {
                classNameStrategy: 'non-scoped',
            },
        },
        // Set a stable origin so tests that build URLs from window.location.origin
        // get a predictable value (http://localhost without a port number).
        environmentOptions: {
            jsdom: {
                url: 'http://localhost',
            },
        },

        setupFiles: [
            './vitest/setup-components.tsx',
        ],

        include: [
            'src/components/**/*.test.[jt]s?(x)',
            'src/app/**/*.test.[jt]s?(x)',
            'src/lib/**/*.test.[jt]s?(x)',
        ],
    },
    resolve: {
        alias: [
            { find: 'server-only', replacement: path.resolve(__dirname, 'vitest/mocks/server-only.ts') },
            { find: /^@\/prisma\/(.*)/, replacement: path.resolve(__dirname, 'prisma/generated/$1') },
            { find: /^@\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
        ],
    },
});
