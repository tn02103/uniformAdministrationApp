import { defineConfig, devices } from '@playwright/experimental-ct-react';
import { viewports } from './tests/_playwrightConfig/global/helper';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './tests/e2e',
    /* Run tests in files in parallel */
    //fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: 1,
    /* Opt out of parallel tests on CI. */
    workers: +(process.env.TEST_WORKERS ?? 2),
    /* amount of allowed failures */
    maxFailures: 20,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [['dot'], ['html']],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:3021',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
    },
    // globalTeardown: require.resolve('./tests/global-teardown'),

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: viewports.xxl
            },
        },
        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox'],
                viewport: viewports.xxl
            },
        },
        {
            name: 'webkit',
            use: {
                ...devices['Desktop Safari'],
                viewport: viewports.xxl
            },
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npm run start',
        url: 'http://127.0.0.1:3021',
        reuseExistingServer: true
    },
});
