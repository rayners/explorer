import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e',
  testMatch: 'telemetry.spec.ts',
  timeout: 30000,
  outputDir: 'test-results/telemetry',
  reporter: 'list',
  use: { serviceWorkers: 'block' },
  webServer: {
    env: { PAGES_BASE_PATH: '/explorer/' },
    command: 'npm run preview -- --host 127.0.0.1 --port 5201 --strictPort',
    url: 'http://127.0.0.1:5201/explorer/',
    reuseExistingServer: false,
  },
  projects: [
    { name: 'telemetry-chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'telemetry-webkit',
      use: { ...devices['iPhone 15 Pro Max'], defaultBrowserType: 'webkit' },
    },
  ],
});
