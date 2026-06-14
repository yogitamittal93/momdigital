import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  reporter: process.env.CI
    ? [['list'], ['junit', { outputFile: 'playwright-report/results.xml' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    extraHTTPHeaders: { Accept: 'application/json' },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: process.env.CI
    ? undefined
    : [
      {
        command: 'npm -w api run start:dev',   // ← fixed workspace syntax
        url: 'http://localhost:3001/api/health',
        timeout: 60_000,
        reuseExistingServer: true,
        stdout: 'pipe',
        stderr: 'pipe',
        env: { NODE_ENV: 'test' },
      },
      {
        command: 'npm -w web run dev',          // ← fixed workspace syntax
        url: 'http://localhost:3000',
        timeout: 60_000,
        reuseExistingServer: true,
        stdout: 'pipe',
        stderr: 'pipe',
      },
    ],
});