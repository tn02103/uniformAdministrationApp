
/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
import nextJest from 'next/jest';

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig = {
    displayName: "ComponentTests",
    setupFilesAfterEnv: [
        '<rootDir>/jest/setup-components.tsx',
    ],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '^uuid$': 'uuid',
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/prisma/(.*)$': '<rootDir>/prisma/generated/$1',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: [
        "**/tests/ct/**/*.[jt]s?(x)",
        "**/src/components/**/*.test.[jt]s?(x)",
        "**/src/app/**/*.test.[jt]s?(x)",
        "**/src/lib/**/*.test.[jt]s?(x)",
    ],
};

export default createJestConfig(customJestConfig);
