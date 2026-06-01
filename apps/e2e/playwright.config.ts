import { defineConfig, devices } from "@playwright/test"

const STAFF_URL  = process.env["STAFF_URL"]  ?? "http://localhost:3001"
const PORTAL_URL = process.env["PORTAL_URL"] ?? "http://localhost:3000"
const KIOSK_URL  = process.env["KIOSK_URL"]  ?? "http://localhost:3002"

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,   // sequential — share DB state
  retries: 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],

  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    locale: "vi-VN",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})

export { STAFF_URL, PORTAL_URL, KIOSK_URL }
