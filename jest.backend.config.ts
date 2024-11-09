import { Config } from "jest";

const customJestConfig: Config = { // CONFIGURATION FOR DATA-ACCESS-LAYER
    displayName: "Data access layer",
    setupFilesAfterEnv: [
        './tests/_jestConfig/data.setup.ts',
    ],
    testEnvironment: 'node',
    moduleNameMapper: {
        '^uuid$': require.resolve('uuid'),
        '^@/components/(.*)$': '<rootDir>/components/$1',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': '@swc/jest',
    },
    testMatch: [
        "**/src/dal/**/*.test.[jt]s?(x)",
    ],
}

export default customJestConfig;
