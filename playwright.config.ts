import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 4,
  reporter: 'html',
  use: { baseURL: 'http://localhost:3100', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'node tests/fixtures/auth-api.mjs', url: 'http://127.0.0.1:3101/__health', reuseExistingServer: false },
    {
      command: 'pnpm exec next dev --port 3100',
      url: 'http://localhost:3100/login',
      reuseExistingServer: false,
      env: { FINANCE_API_URL: 'http://127.0.0.1:3101', FINANCE_APP_ORIGIN: 'http://localhost:3100', FINANCE_NEXT_DIST_DIR: '.next-e2e' },
    },
  ],
})
