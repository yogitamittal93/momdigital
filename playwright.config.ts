import { defineConfig, devices } from '@playwright/test';

/**
 * MomDigital — Root Playwright Configuration
 * Orchestrates both the NestJS API and Next.js web server before running E2E tests.
 *
 * Start order: api (port 3001) → web (port 3000) → tests
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',

  /* Global timeout per test */
  timeout: 30_000,
  expect: { timeout: 8_000 },

  /* Run tests in parallel by default, serial within each file */
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,

  /* Fail the build on CI if a test.only() was accidentally committed */
  forbidOnly: !!process.env.CI,

  /* Retry flaky tests once on CI */
  retries: process.env.CI ? 1 : 0,

  /* Reporters */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
  ],

  use: {
    /* Base URL for the Next.js app */
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',

    /* Always send cookies (session-based auth) */
    extraHTTPHeaders: {
      Accept: 'application/json',
    },

    /* Capture trace on first retry for debugging */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* ─── Service Orchestration ──────────────────────────────────────────────
   * Playwright will start both servers before running any tests and shut
   * them down afterwards.  In CI we rely on the GitHub Actions job to
   * pre-start the services (see ci.yml), so webServer is skipped there.
   * ─────────────────────────────────────────────────────────────────────── */
  webServer: process.env.CI
    ? undefined
    : [
        {
          command: 'npm run start:dev -w api',
          url: 'http://localhost:3001/api/health',
          timeout: 60_000,
          reuseExistingServer: true,
          cwd: __dirname,
          env: {
            NODE_ENV: 'test',
          },
        },
        {
          command: 'npm run dev -w web',
          url: 'http://localhost:3000',
          timeout: 60_000,
          reuseExistingServer: true,
          cwd: __dirname,
        },
      ],
});
