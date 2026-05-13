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
import process from 'node:process';

const PORT = Number(process.env.LESSJS_E2E_PORT ?? 4174);
const baseURL = `http://127.0.0.1:${PORT}`;

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
    baseURL,
    trace: 'on-first-retry',
  },

  // Auto-start a simple static file server for www/dist/
  webServer: {
    command: `npx -y serve ../dist -l ${PORT} --no-clipboard`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
