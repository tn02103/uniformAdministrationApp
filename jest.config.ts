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
    projects: [
        {// CONFIGURATION FOR React-Component Tests
            displayName: "Component Tests",
            setupFilesAfterEnv: [
                '<rootDir>/jest.setup.ts',
                `./tests/_jestConfig/mockI18n.ts`,
            ],
            testEnvironment: 'jest-environment-jsdom',
            moduleNameMapper: {
                '^uuid$': require.resolve('uuid'),
                '^@/components/(.*)$': '<rootDir>/components/$1',
                '^@/(.*)$': '<rootDir>/src/$1',
            },
            transform: {
                '^.+\\.(js|jsx|ts|tsx)$': '@swc/jest',
            },
            testMatch: [
                "**/tests/ct/**/*.[jt]s?(x)",
                //   "** /?(*.)+(spec|test).[tj]s?(x)"
            ],
        },
        { // CONFIGURATION FOR DATA-ACCESS-LAYER
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
        }],
    reporters: [
        "default",
        ["./node_modules/jest-html-reporter", {
            "pageTitle": "Test Report"
        }]
    ],
    testResultsProcessor: "./node_modules/jest-html-reporter"
};

module.exports = createJestConfig(customJestConfig);

