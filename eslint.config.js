import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import vitest from '@vitest/eslint-plugin'
import playwright from 'eslint-plugin-playwright';
import testingLibrary from "eslint-plugin-testing-library";

export default [
    ...nextCoreWebVitals,
    ...nextTypescript,
    { files: ["**/src/**/*", "**/tests/**/*"] },
    {
        rules: {
            'no-console': ['error', {
                allow: ['warn', 'error', 'info'],
            }],
            "react-hooks/set-state-in-effect": "off",
            "react-hooks/immutability": "off",
            "react-hooks/incompatible-library": "off",
        }
    },
    {
        ...vitest.configs.recommended,
        files: ['src/**/*.test.*'],
        rules: {
            "vitest/no-conditional-expect": "warn",
        }
    },
    {
        ...testingLibrary.configs['flat/react'],
        files: ["src/**/*.test.*"],
        rules: {
            ...testingLibrary.configs['flat/react'].rules,
            'testing-library/prefer-screen-queries': "off",
            "testing-library/no-node-access": "warn",
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
    {
        ...playwright.configs['flat/recommended'],
        files: ["tests/**/*.spec.*", "tests/**/setup.ts"],
        rules: {
            ...playwright.configs['flat/recommended'].rules,
            "playwright/no-wait-for-selector": "off",
            'react-hooks/rules-of-hooks': "off",
            "playwright/no-standalone-expect": "off",
            "playwright/no-conditional-in-test": "off",
            "playwright/no-conditional-expect": "off",
        },
    },
];
