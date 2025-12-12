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
        '^@/prisma/(.*)$': '<rootDir>/prisma/generated/$1',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': '@swc/jest',
    },
    testMatch: [
        "**/src/dal/**/*.test.[jt]s?(x)",
        "**/src/dal/**/*.unit.test.[jt]s?(x)",
    ],
    testPathIgnorePatterns: [
        ".*\\.integration\\.test\\.(js|jsx|ts|tsx)$",
    ],
    // Fast execution for unit tests
    maxWorkers: "50%",
}

export default customJestConfig;
