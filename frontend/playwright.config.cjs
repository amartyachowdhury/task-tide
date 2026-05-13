const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

const backendDir = path.join(__dirname, '..', 'backend');
const frontendDir = __dirname;

module.exports = defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome']
  },
  webServer: [
    {
      cwd: backendDir,
      command: 'PORT=3001 NODE_ENV=development DISABLE_TASK_PERSISTENCE=1 node src/server.js',
      url: 'http://127.0.0.1:3001/health',
      timeout: 45_000,
      reuseExistingServer: !process.env.CI
    },
    {
      cwd: frontendDir,
      command: 'python3 -m http.server 4173',
      url: 'http://127.0.0.1:4173/public/index.html',
      timeout: 45_000,
      reuseExistingServer: !process.env.CI
    }
  ]
});
