import { defineConfig } from 'vitest/config';

/**
 * Centralized Vitest workspace config.
 * Runs all three test suites together; each project keeps its own
 * environment, setup files and include/exclude patterns.
 *
 * Run all:              npx vitest run  (or npm run test:vitest)
 * Run one project:      npx vitest run --project Frontend
 *                       npx vitest run --project DAL-Unit
 *                       npx vitest run --project DAL-Integration
 */
export default defineConfig({
    test: {
        projects: [
            'vitest.frontend.config.ts',
            'vitest.dal-unit.config.ts',
            'vitest.dal-integration.config.ts',
        ]
    }
});
