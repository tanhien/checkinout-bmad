# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> TC-AUTH-03: HOUSEKEEPING không vào được /settings — redirect về /dashboard
- Location: tests/auth.spec.ts:39:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/login
Call log:
  - navigating to "http://localhost:3001/login", waiting until "load"

```

# Test source

```ts
  1  | import { type Page, expect } from "@playwright/test"
  2  | 
  3  | const URL = process.env["STAFF_URL"] ?? "http://localhost:3001"
  4  | 
  5  | export class StaffLoginPage {
  6  |   constructor(private page: Page) {}
  7  | 
  8  |   async goto() {
> 9  |     await this.page.goto(`${URL}/login`)
     |                     ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/login
  10 |     await expect(this.page.locator("form")).toBeVisible()
  11 |   }
  12 | 
  13 |   async login(email: string, password: string) {
  14 |     await this.page.fill('[type="email"]', email)
  15 |     await this.page.fill('[type="password"]', password)
  16 |     await this.page.click('[type="submit"]')
  17 |   }
  18 | 
  19 |   async loginExpectSuccess(email: string, password: string) {
  20 |     await this.login(email, password)
  21 |     await expect(this.page).toHaveURL(/\/(dashboard|bookings|housekeeping)/, { timeout: 10_000 })
  22 |   }
  23 | 
  24 |   async loginExpectError(email: string, password: string) {
  25 |     await this.login(email, password)
  26 |     await expect(this.page.locator("text=/không đúng|invalid|error/i")).toBeVisible({ timeout: 5_000 })
  27 |   }
  28 | }
  29 | 
  30 | export class StaffDashboardPage {
  31 |   constructor(private page: Page) {}
  32 | 
  33 |   async goto() {
  34 |     await this.page.goto(`${URL}/dashboard`)
  35 |   }
  36 | 
  37 |   sidebar() {
  38 |     return this.page.locator("nav, aside").first()
  39 |   }
  40 | 
  41 |   async hasSidebarLink(label: RegExp | string) {
  42 |     return this.sidebar().locator(`text=${label}`).isVisible()
  43 |   }
  44 | }
  45 | 
  46 | export class StaffBookingsPage {
  47 |   constructor(private page: Page) {}
  48 | 
  49 |   async goto() {
  50 |     await this.page.goto(`${URL}/bookings`)
  51 |     await expect(this.page.locator("h1, h2").first()).toBeVisible()
  52 |   }
  53 | 
  54 |   async openBooking(code: string) {
  55 |     await this.page.goto(`${URL}/bookings`)
  56 |     await this.page.fill('[placeholder*="tìm" i], [placeholder*="search" i], input[type="search"]', code)
  57 |     await this.page.keyboard.press("Enter")
  58 |     await this.page.locator(`text=${code}`).first().click()
  59 |     await expect(this.page).toHaveURL(/\/bookings\//, { timeout: 8_000 })
  60 |   }
  61 | 
  62 |   async checkIn() {
  63 |     await this.page.locator('button:has-text("Check-in"), button:has-text("Nhận phòng")').first().click()
  64 |     await this.page.locator('button:has-text("Xác nhận"), button:has-text("Confirm")').click()
  65 |   }
  66 | 
  67 |   async checkOut() {
  68 |     await this.page.locator('button:has-text("Check-out"), button:has-text("Trả phòng")').first().click()
  69 |     await this.page.locator('button:has-text("Xác nhận"), button:has-text("Confirm")').click()
  70 |   }
  71 | 
  72 |   async cancel(reason = "E2E test cancel") {
  73 |     await this.page.locator('button:has-text("Hủy"), button:has-text("Cancel")').first().click()
  74 |     const reasonInput = this.page.locator('textarea, input[placeholder*="lý do" i]')
  75 |     if (await reasonInput.isVisible()) await reasonInput.fill(reason)
  76 |     await this.page.locator('button:has-text("Xác nhận"), button:has-text("Confirm")').last().click()
  77 |   }
  78 | }
  79 | 
```