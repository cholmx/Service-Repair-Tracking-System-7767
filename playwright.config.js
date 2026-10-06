import { defineConfig } from '@playwright/test'

const PORT = 5199

// The tests run the real app against a fake Supabase (see e2e/backend.js), so they need no
// database or network. If Playwright's own Chromium is not installed, point
// PLAYWRIGHT_CHROMIUM_EXECUTABLE at any Chromium or Chrome binary.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
      args: ['--no-sandbox']
    }
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-key'
    }
  }
})
