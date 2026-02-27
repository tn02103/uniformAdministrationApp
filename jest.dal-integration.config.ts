import { Config } from "jest";

const customJestConfig: Config = { // CONFIGURATION FOR DAL INTEGRATION TESTS (WITH REAL DB)
    displayName: "DAL-Integration",
    
    setupFilesAfterEnv: [
        './jest/setup-dal-integration.ts',
    ],
    
    testEnvironment: 'node',
    
    // ESM configuration according to Jest docs
    preset: 'ts-jest/presets/default-esm',
    extensionsToTreatAsEsm: ['.ts'],
    
    // Disable transforms for ESM - let Node.js handle them
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            useESM: true,
        }],
    },
    
    // Module name mapping for ESM
    moduleNameMapper: {
        '^uuid$': 'uuid',
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/prisma/(.*)$': '<rootDir>/prisma/generated/$1',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    
    // Don't transform node_modules to allow ESM modules to work
    transformIgnorePatterns: [
        'node_modules/(?!(@prisma|uuid)/)'
    ],
    
    testMatch: [
        "**/src/dal/**/*.integration.test.[jt]s?(x)",
    ],
    maxWorkers: 1, // Important for database tests
    detectOpenHandles: true, // Help identify connection leaks
}

export default customJestConfig;
