/**
 * Playwright configuration for LessJS E2E tests.
 *
 * Tests run against the built www site (static HTML).
 * Uses a simple HTTP server instead of Vite preview (which may fail
 * in CI due to config resolution issues).
 *
 * Prerequisites:
 *   1. deno task build   (build the www site to www/dist/)
 *
 * Run: deno task test:e2e
 */
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },

  // Auto-start a simple static file server for www/dist/
  webServer: {
    command: 'npx -y serve ../dist -l 4173 --no-clipboard',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
