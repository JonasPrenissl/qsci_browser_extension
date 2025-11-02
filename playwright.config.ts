import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 90_000, // Increased from 60s to 90s to accommodate PDF detection delays
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    headless: true,
    trace: 'on-first-retry',
  },
});
