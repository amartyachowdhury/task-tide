const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

const backendDir = path.join(__dirname, '..', 'backend');
const frontendDir = __dirname;

// Avoid reusing an unrelated process on 3001 when reuseExistingServer is on.
// Playwright tests inject this origin via window.__TASK_TIDE_API_BASE__ (see e2e/app.spec.js).
if (!process.env.E2E_API_PORT) {
  process.env.E2E_API_PORT = '31041';
}
const e2eApiPort = process.env.E2E_API_PORT;

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
      command: `PORT=${e2eApiPort} NODE_ENV=test DISABLE_TASK_PERSISTENCE=1 node src/server.js`,
      url: `http://127.0.0.1:${e2eApiPort}/health`,
      timeout: 45_000,
      reuseExistingServer: false
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
