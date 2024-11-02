const customJestConfig = { // CONFIGURATION FOR DATA-ACCESS-LAYER
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
        "**/tests/dal/**/*.[jt]s?(x)",
        //   "** /?(*.)+(spec|test).[tj]s?(x)"
    ],
}

export default customJestConfig;
