import type { Config } from 'jest';

/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

const customJestConfig: Config = {
    projects: [
        "<rootDir>/jest.frontend.config.ts",
        "<rootDir>/jest.backend.config.ts",
    ],
    reporters: [
        "default",
        ["./node_modules/jest-html-reporter", {
            "pageTitle": "Test Report"
        }]
    ],
    testResultsProcessor: "./node_modules/jest-html-reporter"
};

module.exports = customJestConfig;

