import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results/game',
  testMatch: [
    'game.spec.ts',
    'expansion.spec.ts',
    'picker.spec.ts',
    'readability.spec.ts',
    'watches.spec.ts',
    'destinations.spec.ts',
  ],
  timeout: 30000,
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5199', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5199 --strictPort',
    url: 'http://127.0.0.1:5199',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone', use: { ...devices['iPhone 15 Pro Max'], defaultBrowserType: 'webkit' } },
    { name: 'tablet', use: { ...devices['iPad Pro 11'], defaultBrowserType: 'webkit' } },
  ],
});
