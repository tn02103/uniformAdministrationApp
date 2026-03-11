import { Config } from "jest";

const customJestConfig: Config = { // CONFIGURATION FOR DAL INTEGRATION TESTS (WITH REAL DB)
    displayName: "DAL-Integration",
    setupFilesAfterEnv: [
        './jest/setup-dal-integration.ts',
    ],
    testEnvironment: 'node',
    moduleNameMapper: {
        '^ioredis$': '<rootDir>/node_modules/ioredis-mock',
        '^uuid$': require.resolve('uuid'),
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': '@swc/jest',
    },
    testMatch: [
        "**/src/dal/**/*.integration.test.[jt]s?(x)",
    ],
    maxWorkers: 1, // Important for database tests
    // Add these for better database testing
    detectOpenHandles: true, // Help identify connection leaks
}

export default customJestConfig;
