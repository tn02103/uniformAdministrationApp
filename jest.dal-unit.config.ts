import { Config } from "jest";

const customJestConfig: Config = { // CONFIGURATION FOR DAL UNIT TESTS (MOCKED)
    displayName: "DAL-Unit",
    setupFilesAfterEnv: [
        './jest/setup-dal-unit.ts',
    ],
    testEnvironment: 'node',
    moduleNameMapper: {
        '^uuid$': require.resolve('uuid'),
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': '@swc/jest',
    },
    testMatch: [
        "**/src/dal/**/*.unit.test.[jt]s?(x)",
    ],
    // Fast execution for unit tests
    maxWorkers: "50%",
    testTimeout: 5000,
}

export default customJestConfig;
