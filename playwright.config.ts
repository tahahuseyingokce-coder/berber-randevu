import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

/**
 * .env.local'i test sürecine de yükler.
 *
 * Playwright kendi node sürecinde çalışıyor ve Next'in env yüklemesinden
 * faydalanmıyor; bu satır olmadan E2E_OWNER_* tanımlı olsa bile
 * `process.env` içinde görünmüyor ve rol testleri sessizce atlanıyordu.
 */
loadEnvConfig(process.cwd());

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Testler ortak bir Supabase projesine yazıyor.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL,
    trace: "on-first-retry",
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
