import type { Config } from 'jest';

/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig: Config = {
    displayName: "ComponentTests",
    setupFilesAfterEnv: [
        '<rootDir>/jest/jest.setup.tsx',
    ],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '^uuid$': require.resolve('uuid'),
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: [
        "**/tests/ct/**/*.[jt]s?(x)",
        "**/src/components/**/*.test.[jt]s?(x)",
        "**/src/app/**/*.test.[jt]s?(x)",
        "**/src/lib/**/*.test.[jt]s?(x)",
    ],
};

export default createJestConfig(customJestConfig);
