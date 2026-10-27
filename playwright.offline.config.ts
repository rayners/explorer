import { defineConfig, devices } from '@playwright/test';
const baseURL = `http://127.0.0.1:5200${process.env.PAGES_BASE_PATH ?? '/'}`;
export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results/offline',
  testMatch: 'offline.spec.ts',
  timeout: 30000,
  reporter: 'list',
  use: { baseURL },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 5200 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
  },
  projects: [
    { name: 'offline-chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'offline-webkit',
      use: { ...devices['iPhone 15 Pro Max'], defaultBrowserType: 'webkit' },
    },
  ],
});
