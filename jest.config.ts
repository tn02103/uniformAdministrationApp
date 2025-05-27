import type { Config } from 'jest';

/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

const customJestConfig: Config = {
    maxWorkers: 1,
    projects: [
        "<rootDir>/jest.backend.config.ts",
        "<rootDir>/jest.frontend.config.ts",
    ],
};

module.exports = customJestConfig;
