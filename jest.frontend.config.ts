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
        '<rootDir>/jest.setup.ts',
        '<rootDir>/tests/_jestConfig/mockI18n.ts',
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
    ],
    maxWorkers: 10,
};

export default createJestConfig(customJestConfig);
