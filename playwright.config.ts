import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/browser/specs',
  timeout: 45000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure', launchOptions: process.env.ANNEXUS_BROWSER_PATH ? { executablePath: process.env.ANNEXUS_BROWSER_PATH, args: ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage'] } : {} },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 900 } } }],
  webServer: [
    { command: 'npm run dev -- --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI, timeout: 60000 },
    ...(process.env.ANNEXUS_SKIP_ASTRO ? [] : [{ command: 'node .cache/astro-consumer/dist/server/entry.mjs', url: 'http://127.0.0.1:4321', env: { HOST: '127.0.0.1', PORT: '4321' }, reuseExistingServer: !process.env.CI, timeout: 30000 }])
  ]
})
