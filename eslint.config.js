import { FlatCompat } from '@eslint/eslintrc';
import jest from "eslint-plugin-jest";
import testingLibrary from "eslint-plugin-testing-library";
import playwright from 'eslint-plugin-playwright';

const compat = new FlatCompat({
    // import.meta.dirname is available after Node.js v20.11.0
    baseDirectory: import.meta.dirname,
})

const eslintConfig = [
    ...compat.config({
        extends: ['next/core-web-vitals', 'next/typescript'],
    }),
    { files: ["**/src/**/*", "**/tests/**/*"] },
    {
        ...jest.configs['flat/recommended'],
        files: ['src/**/*.test.*'],
    },
    {
        ...testingLibrary.configs['flat/react'],
        files: ["src/**/*.test.*"],
        rules: {
            ...testingLibrary.configs['flat/react'].rules,
            'testing-library/prefer-screen-queries': "off",
            "testing-library/no-node-access": "warn",
        },
    },
    {
        ...playwright.configs['flat/recommended'],
        files: ["tests/**/*.spec.*", "tests/**/setup.ts"],
        rules: {
            ...playwright.configs['flat/recommended'].rules,
            'react-hooks/rules-of-hooks': "off",
            "playwright/no-standalone-expect": "off",
        },
    },
]

export default eslintConfig;
